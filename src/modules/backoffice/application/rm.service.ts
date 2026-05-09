import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { UserServiceEntity } from '../../operations/infrastructure/persistence/user-service.entity';
import { toUserResource } from '../../identity/application/identity.mapper';
import { toUserServiceResource } from '../../operations/application/operations.mapper';
import { UserServicesService } from '../../operations/application/user-services.service';
import { NotificationService } from '../../communication/notification.service';

@Injectable()
export class RMService {
    private static readonly ACTIVE_SERVICE_TERMINAL_STATUSES = [
        'cancelled',
        'completed',
        'rejected',
        'approved',
    ];

    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
        private readonly userServicesService: UserServicesService,
        private readonly notificationService: NotificationService,
    ) {}

    async getAssignedUsers(rmId: number) {
        const users = await this.usersRepository.find({
            where: { rmId, role: 'user' },
            relations: { accountant: true },
            take: 20,
        });

        return users.map(toUserResource);
    }

    async getAccountants() {
        return this.usersRepository.find({
            where: { role: 'accountant' },
            select: ['id', 'name', 'email', 'mobileNumber'],
            order: { name: 'ASC' },
        });
    }

    async assignAccountant(rmId: number, userId: number, accountantId: number | null) {
        const user = await this.usersRepository.findOne({
            where: { id: userId, rmId },
        });

        if (!user) {
            throw new NotFoundException('User not found or not assigned to you');
        }

        if (accountantId) {
            const accountant = await this.usersRepository.findOne({
                where: { id: accountantId, role: 'accountant' },
            });
            if (!accountant) {
                throw new UnauthorizedException('Invalid accountant');
            }
            user.accountantId = accountantId;
            await this.userServicesRepository.update(
                {
                    userId,
                    status: Not(
                        In(RMService.ACTIVE_SERVICE_TERMINAL_STATUSES),
                    ),
                },
                { accountantId },
            );
            await this.notificationService.sendAccountantAssignmentNotification(
                accountant,
                user,
            );

        } else {
            user.accountantId = null;
            await this.userServicesRepository.update(
                {
                    userId,
                    status: Not(
                        In(RMService.ACTIVE_SERVICE_TERMINAL_STATUSES),
                    ),
                },
                { accountantId: null },
            );
        }

        await this.usersRepository.save(user);
        return toUserResource(user);
    }

    async getAssignedUserServices(rmId: number) {
        const users = await this.usersRepository.find({
            where: { rmId, role: 'user' },
            select: ['id'],
        });
        const userIds = Array.isArray(users) ? users.map(u => u.id) : [];

        if (userIds.length === 0) return [];

        const services = await this.userServicesRepository.find({
            where: { userId: In(userIds), status: Not('in_cart') },
            relations: {
                service: true,
                user: true,
                accountant: true,
            },
            order: { createdAt: 'DESC' },
        });

        await this.userServicesService.populateRequestDocuments(services);
        await this.userServicesService.populateLatestPayments(services);

        return services.map((service) => toUserServiceResource(service));
    }
}
