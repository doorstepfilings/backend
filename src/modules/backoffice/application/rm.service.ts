import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
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
        private readonly prisma: PrismaService,
        private readonly userServicesService: UserServicesService,
        private readonly notificationService: NotificationService,
    ) {}

    async getAssignedUsers(rmId: number) {
        const users = await this.prisma.user.findMany({
            where: { rmId, role: 'user' },
            include: { accountant: true },
            take: 20,
        });

        return users.map(toUserResource);
    }

    async getAccountants() {
        return this.prisma.user.findMany({
            where: { role: 'accountant' },
            select: { id: true, name: true, email: true, mobileNumber: true },
            orderBy: { name: 'asc' },
        });
    }

    async assignAccountant(rmId: number, userId: number, accountantId: number | null) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, rmId },
        });

        if (!user) {
            throw new NotFoundException('User not found or not assigned to you');
        }

        if (accountantId) {
            const accountant = (await this.prisma.user.findFirst({
                where: { id: accountantId, role: 'accountant' },
            })) as any;
            if (!accountant) {
                throw new UnauthorizedException('Invalid accountant');
            }
            
            await this.prisma.userService.updateMany({
                where: {
                    userId,
                    status: { notIn: RMService.ACTIVE_SERVICE_TERMINAL_STATUSES },
                },
                data: { accountantId },
            });
            
            await this.notificationService.sendAccountantAssignmentNotification(
                accountant,
                user as any,
            ).catch(err => console.error('[RMService] Notification error:', err));

            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: { accountantId }
            });
            return toUserResource(updatedUser);

        } else {
            await this.prisma.userService.updateMany({
                where: {
                    userId,
                    status: { notIn: RMService.ACTIVE_SERVICE_TERMINAL_STATUSES },
                },
                data: { accountantId: null },
            });

            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: { accountantId: null }
            });
            return toUserResource(updatedUser);
        }
    }

    async getAssignedUserServices(rmId: number) {
        const users = await this.prisma.user.findMany({
            where: { rmId, role: 'user' },
            select: { id: true },
        });
        const userIds = Array.isArray(users) ? users.map(u => u.id) : [];

        if (userIds.length === 0) return [];

        const services = (await this.prisma.userService.findMany({
            where: { userId: { in: userIds }, status: { not: 'in_cart' } },
            include: {
                service: true,
                user: true,
                accountant: true,
            },
            orderBy: { createdAt: 'desc' },
        })) as any[];

        await this.userServicesService.populateRequestDocuments(services);
        await this.userServicesService.populateLatestPayments(services);

        return services.map((service) => toUserServiceResource(service));
    }
}
