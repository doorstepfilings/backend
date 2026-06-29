import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../shared/services/prisma.service';
import { LoginDto } from '../presentation/http/dto/login.dto';
import { RegisterDto } from '../presentation/http/dto/register.dto';
import { toUserResource } from './identity.mapper';
import { NotificationService } from '../../communication/notification.service';
import type { AppEnvironment } from '../../../config/environment';

type JwtPayload = {
  email: string;
  role: string;
  sub: number;
};

type OauthLoginInput = {
  provider: 'google';
  email: string;
  name?: string | null;
  provider_account_id: string;
  image?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) { }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        accountant: true,
        regionalManager: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_FOUND',
        message: 'Email not found',
      });
    }

    const passwordMatches = await compare(
      loginDto.password,
      normalizePasswordHash(user.password),
    );

    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: 'INCORRECT_PASSWORD',
        message: 'Incorrect password',
      });
    }

    const payload: JwtPayload = {
      email: user.email,
      role: user.role,
      sub: user.id,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: toUserResource(user),
    };
  }

  async getCurrentUser(userId: number) {
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

    return toUserResource(user);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const verifiedOtp = await this.prisma.otpVerification.findFirst({
      where: {
        identifier: email,
        verified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verifiedOtp) {
      throw new BadRequestException(
        'Email not verified. Please verify with OTP first.',
      );
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('This email address is already registered.');
    }

    const existingMobile = await this.prisma.user.findFirst({
      where: { mobileNumber: dto.mobile_number },
    });

    if (existingMobile) {
      throw new ConflictException(
        'This mobile number is already registered with another account.',
      );
    }

    let regionalManagerId: number | null = null;
    let referralCode = dto.referral_code ?? null;

    // If direct rm_id is provided (usually from admin/RM creation)
    if (dto.rm_id) {
      const regionalManager = await this.prisma.user.findUnique({
        where: { rmUniqueId: dto.rm_id },
      });

      if (!regionalManager || regionalManager.role !== 'regional_manager') {
        throw new BadRequestException('Invalid Relationship Manager ID.');
      }
      regionalManagerId = regionalManager.id;
    }
    // Else if referral_code is provided (user registration)
    else if (referralCode) {
      const regionalManager = await this.prisma.user.findUnique({
        where: { rmUniqueId: referralCode },
      });

      if (regionalManager?.role === 'regional_manager') {
        regionalManagerId = regionalManager.id;
      }
    }

    if (regionalManagerId) {
      const assignedUserCount = await this.prisma.user.count({
        where: {
          rmId: regionalManagerId,
          role: 'user',
        },
      });

      if (assignedUserCount >= 20) {
        throw new BadRequestException(
          'The selected Relationship Manager has reached their user limit.',
        );
      }
    }

    const password = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        mobileNumber: dto.mobile_number,
        password,
        referralCode,
        role: dto.role || 'user',
        rmId: regionalManagerId,
      },
    });
    const token = await this.issueJwtForUser(user);

    // Send welcome email
    await this.notificationService.sendWelcomeNotification(user);

    return {
      token,
      user: toUserResource(user),
    };
  }

  async sendOtp(identifier: string): Promise<void> {
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (normalizedIdentifier.includes('@')) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedIdentifier },
      });
      if (existingUser) {
        throw new ConflictException('This email address is already registered.');
      }
    } else {
      const existingUser = await this.prisma.user.findFirst({
        where: { mobileNumber: normalizedIdentifier },
      });
      if (existingUser) {
        throw new ConflictException('This mobile number is already registered.');
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.prisma.otpVerification.create({
      data: {
        identifier: normalizedIdentifier,
        otp,
        expiresAt,
      },
    });

    if (normalizedIdentifier.includes('@')) {
      await this.notificationService.sendRegisterOtpNotification(
        normalizedIdentifier,
        otp,
      );
    } else {
      const formattedPhone = formatPhoneNumber(normalizedIdentifier);
      await this.notificationService.sendSms(
        formattedPhone,
        `DoorStepFilings verification code is: ${otp}. This code expires in 10 minutes.`,
      );
    }
  }

  async verifyOtp(identifier: string, otp: string) {
    const normalizedIdentifier = normalizeIdentifier(identifier);
    const record = await this.prisma.otpVerification.findFirst({
      where: { identifier: normalizedIdentifier, otp, verified: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return { success: true };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // Return success even if user not found for security
        return {};
      }

      const resetToken = randomToken(10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      const appEnvironment =
        this.configService.getOrThrow<AppEnvironment>('app');

      const frontendUrl = appEnvironment.frontendUrl.endsWith('/')
        ? appEnvironment.frontendUrl.slice(0, -1)
        : appEnvironment.frontendUrl;

      const resetUrl = `${frontendUrl}/reset-password/${resetToken}?email=${encodeURIComponent(normalizedEmail)}`;

      await this.prisma.otpVerification.create({
        data: {
          identifier: `reset:${normalizedEmail}`,
          otp: resetToken,
          expiresAt,
        },
      });

      await this.notificationService.sendEmail(
        normalizedEmail,
        'Reset your Doorstep password',
        'password-reset',
        {
          reset_url: resetUrl,
          token: resetToken,
          userName: user.name,
        },
      );

      return this.devOnlyPayload({
        reset_token: resetToken,
        reset_url: resetUrl,
      });
    } catch (error) {
      console.error(`[ForgotPassword Error] for ${normalizedEmail}:`, error);
      throw error;
    }
  }

  async resetPassword(email: string, token: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        identifier: `reset:${normalizedEmail}`,
        otp: token,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return { message: 'Password reset successfully' };
  }

  async sendLoginOtp(mobileNumber: string): Promise<void> {
    const user = await this.findUserByMobile(mobileNumber);

    if (!user) {
      throw new NotFoundException(
        'No account found with this mobile number. Please register first.',
      );
    }

    const normalizedMobile = normalizeMobileIdentifier(mobileNumber);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: {
        identifier: normalizedMobile,
        otp,
        expiresAt,
      },
    });

    const formattedPhone = formatPhoneNumber(mobileNumber);
    this.notificationService.sendSms(
      formattedPhone,
      `Your K P Chaudhary & Co. login code is: ${otp}. This code expires in 10 minutes.`,
    );
  }

  async loginWithMobile(mobileNumber: string, otp: string) {
    const normalizedMobile = normalizeMobileIdentifier(mobileNumber);
    await this.verifyOtp(normalizedMobile, otp);

    const user = await this.findUserByMobile(normalizedMobile);

    if (!user) {
      throw new NotFoundException(
        'No account found with this mobile number. Please register first.',
      );
    }

    return {
      token: await this.issueJwtForUser(user),
      user: toUserResource(user),
    };
  }

  async loginWithOauth(input: OauthLoginInput, socialAuthSecret?: string) {
    this.assertValidSocialAuthSecret(socialAuthSecret);

    const provider = input.provider.trim().toLowerCase();
    if (provider !== 'google') {
      throw new BadRequestException('Unsupported social login provider');
    }

    const email = input.email.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const providerAccountId = input.provider_account_id.trim();
    if (!providerAccountId) {
      throw new BadRequestException('Provider account id is required');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accountant: true,
        regionalManager: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: normalizeSocialName(input.name, email),
          email,
          password: await hash(
            `${provider}:${providerAccountId}:${randomToken(32)}`,
            10,
          ),
          role: 'user',
        },
        include: {
          accountant: true,
          regionalManager: true,
        },
      });
    }

    return {
      token: await this.issueJwtForUser(user),
      user: toUserResource(user),
    };
  }

  logout() {
    return null;
  }

  private assertValidSocialAuthSecret(socialAuthSecret?: string) {
    const expectedSecret = this.configService
      .get<string>('SOCIAL_AUTH_SHARED_SECRET')
      ?.trim();

    if (!expectedSecret || socialAuthSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid social authentication request');
    }
  }

  private async issueJwtForUser(user: {
    email: string;
    role: string;
    id: number;
  }) {
    const payload: JwtPayload = {
      email: user.email,
      role: user.role,
      sub: user.id,
    };

    return this.jwtService.signAsync(payload);
  }

  private async findUserByMobile(mobileNumber: string) {
    const normalizedMobile = normalizeMobileIdentifier(mobileNumber);

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: mobileNumber },
          { mobileNumber: normalizedMobile },
          // Simplified: Prisma doesn't have a direct REPLACE/LIKE in a single where clause without raw SQL
          // But we can use contains for a partial match if needed.
          { mobileNumber: { contains: normalizedMobile } },
        ],
      },
    });
  }

  private devOnlyPayload<T extends Record<string, unknown>>(data: T) {
    const appEnvironment = this.configService.getOrThrow<AppEnvironment>('app');

    return (appEnvironment.nodeEnv === 'development' || appEnvironment.nodeEnv === 'test') ? data : {};
  }
}

function normalizePasswordHash(hash: string) {
  return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
}

function normalizeMobileIdentifier(identifier: string) {
  const digits = identifier.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeIdentifier(identifier: string) {
  return identifier.includes('@')
    ? identifier.trim().toLowerCase()
    : normalizeMobileIdentifier(identifier);
}

function randomToken(length: number) {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}

function normalizeSocialName(name: string | null | undefined, email: string) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return email.split('@')[0] || 'User';
}

function formatPhoneNumber(mobileNumber: string) {
  const digitsOnly = mobileNumber.replace(/\D/g, '');

  // India: starts with 91 and 12 digits, or 10 digits starting with 6-9
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  } else if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}
