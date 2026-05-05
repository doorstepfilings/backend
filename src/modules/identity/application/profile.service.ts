import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { toUserResource } from './identity.mapper';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { ChangePasswordDto } from '../presentation/http/dto/change-password.dto';
import { UpdateProfileDto } from '../presentation/http/dto/update-profile.dto';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
    ) {}

    async searchRegionalManager(rmUniqueId: string) {
        const regionalManager = await this.usersRepository.findOne({
            where: {
                role: 'regional_manager',
                rmUniqueId,
            },
        });

        if (!regionalManager) {
            throw new NotFoundException('Regional Manager not found');
        }

        return {
            id: regionalManager.id,
            name: regionalManager.name,
            email: regionalManager.email,
            mobile_number: regionalManager.mobileNumber,
            rm_unique_id: regionalManager.rmUniqueId,
        };
    }

    async connectRegionalManager(userId: number, rmUniqueId: string) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.rmId) {
            throw new BadRequestException('You already have an RM connected');
        }

        const regionalManager = await this.usersRepository.findOne({
            where: {
                role: 'regional_manager',
                rmUniqueId,
            },
        });

        if (!regionalManager) {
            throw new NotFoundException('Regional Manager not found');
        }

        const assignedUserCount = await this.usersRepository.count({
            where: {
                rmId: regionalManager.id,
                role: 'user',
            },
        });

        if (assignedUserCount >= 20) {
            throw new BadRequestException(
                'This Regional Manager has reached the maximum limit of 20 assigned users.',
            );
        }

        user.rmId = regionalManager.id;
        await this.usersRepository.save(user);

        const hydratedUser = await this.usersRepository.findOneOrFail({
            where: {
                id: user.id,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });

        return toUserResource(hydratedUser);
    }

    async updateProfile(userId: number, dto: UpdateProfileDto) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (dto.email) {
            const existingEmailUser = await this.usersRepository.findOne({
                where: {
                    email: dto.email.trim().toLowerCase(),
                },
            });

            if (existingEmailUser && existingEmailUser.id !== user.id) {
                throw new ConflictException('Email is already in use');
            }
        }

        if (dto.mobile_number) {
            const existingMobileUser = await this.usersRepository.findOne({
                where: {
                    mobileNumber: dto.mobile_number,
                },
            });

            if (existingMobileUser && existingMobileUser.id !== user.id) {
                throw new ConflictException('Mobile number is already in use');
            }
        }

        if (dto.name !== undefined) user.name = dto.name;
        if (dto.email !== undefined)
            user.email = dto.email.trim().toLowerCase();
        if (dto.mobile_number !== undefined)
            user.mobileNumber = dto.mobile_number;
        if (dto.address !== undefined) user.address = dto.address;
        if (dto.city !== undefined) user.city = dto.city;
        if (dto.state !== undefined) user.state = dto.state;
        if (dto.pincode !== undefined) user.pincode = dto.pincode;

        await this.usersRepository.save(user);

        const hydratedUser = await this.usersRepository.findOneOrFail({
            where: {
                id: user.id,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });

        return toUserResource(hydratedUser);
    }

    async changePassword(userId: number, dto: ChangePasswordDto) {
        if (dto.new_password !== dto.new_password_confirmation) {
            throw new BadRequestException('New passwords do not match');
        }

        if (dto.current_password === dto.new_password) {
            throw new BadRequestException(
                'New password must be different from current password',
            );
        }

        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const passwordMatches = await compare(
            dto.current_password,
            normalizePasswordHash(user.password),
        );

        if (!passwordMatches) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await hash(dto.new_password, 10);
        await this.usersRepository.save(user);

        return null;
    }
}

function normalizePasswordHash(passwordHash: string) {
    return passwordHash.startsWith('$2y$')
        ? `$2a$${passwordHash.slice(4)}`
        : passwordHash;
}
