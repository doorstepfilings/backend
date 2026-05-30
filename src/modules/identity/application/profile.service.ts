import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toUserResource } from './identity.mapper';
import { ChangePasswordDto } from '../presentation/http/dto/change-password.dto';
import { UpdateProfileDto } from '../presentation/http/dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRegionalManager(rmUniqueId: string) {
    const regionalManager = await this.prisma.user.findUnique({
      where: { rmUniqueId },
    });

    if (!regionalManager || regionalManager.role !== 'regional_manager') {
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
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
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

    const regionalManager = await this.prisma.user.findUnique({
      where: { rmUniqueId },
    });

    if (!regionalManager || regionalManager.role !== 'regional_manager') {
      throw new NotFoundException('Regional Manager not found');
    }

    const assignedUserCount = await this.prisma.user.count({
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { rmId: regionalManager.id },
    });

    const hydratedUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      include: {
        accountant: true,
        regionalManager: true,
      },
    });

    return toUserResource(hydratedUser);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        accountant: true,
        regionalManager: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      const existingEmailUser = await this.prisma.user.findUnique({
        where: {
          email: dto.email.trim().toLowerCase(),
        },
      });

      if (existingEmailUser && existingEmailUser.id !== user.id) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (dto.mobile_number) {
      const existingMobileUser = await this.prisma.user.findFirst({
        where: {
          mobileNumber: dto.mobile_number,
        },
      });

      if (existingMobileUser && existingMobileUser.id !== user.id) {
        throw new ConflictException('Mobile number is already in use');
      }
    }

    const updatedData: any = {};
    if (dto.name !== undefined) updatedData.name = dto.name;
    if (dto.email !== undefined)
      updatedData.email = dto.email.trim().toLowerCase();
    if (dto.mobile_number !== undefined)
      updatedData.mobileNumber = dto.mobile_number;
    if (dto.address !== undefined) updatedData.address = dto.address;
    if (dto.city !== undefined) updatedData.city = dto.city;
    if (dto.state !== undefined) updatedData.state = dto.state;
    if (dto.pincode !== undefined) updatedData.pincode = dto.pincode;

    await this.prisma.user.update({
      where: { id: user.id },
      data: updatedData,
    });

    const hydratedUser = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      include: {
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

    const user = await this.prisma.user.findUnique({
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

    const hashedPassword = await hash(dto.new_password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    return null;
  }
}

function normalizePasswordHash(passwordHash: string) {
  return passwordHash.startsWith('$2y$')
    ? `$2a$${passwordHash.slice(4)}`
    : passwordHash;
}
