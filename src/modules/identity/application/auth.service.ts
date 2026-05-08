import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { OtpVerificationEntity } from '../infrastructure/persistence/otp-verification.entity';
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

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(OtpVerificationEntity)
        private readonly otpRepository: Repository<OtpVerificationEntity>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
    ) {}

    async login(loginDto: LoginDto) {
        const email = loginDto.email.trim().toLowerCase();
        const user = await this.usersRepository.findOne({
            where: {
                email,
            },
            relations: {
                accountant: true,
                regionalManager: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await compare(
            loginDto.password,
            normalizePasswordHash(user.password),
        );

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid email or password');
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

        return toUserResource(user);
    }

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();
        const verifiedOtp = await this.otpRepository.findOne({
            where: {
                identifier: email,
                verified: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        if (!verifiedOtp) {
            throw new BadRequestException(
                'Email not verified. Please verify with OTP first.',
            );
        }

        const existing = await this.usersRepository.findOne({
            where: [{ email }, { mobileNumber: dto.mobile_number }],
        });

        if (existing) {
            throw new ConflictException('User already exists');
        }

        let regionalManagerId: number | null = null;
        let referralCode = dto.referral_code ?? null;

        // If direct rm_id is provided (usually from admin/RM creation)
        if (dto.rm_id) {
            const regionalManager = await this.usersRepository.findOne({
                where: {
                    role: 'regional_manager',
                    rmUniqueId: dto.rm_id,
                },
            });

            if (!regionalManager) {
                throw new BadRequestException('Invalid Regional Manager ID.');
            }
            regionalManagerId = regionalManager.id;
        } 
        // Else if referral_code is provided (user registration)
        else if (referralCode) {
            const regionalManager = await this.usersRepository.findOne({
                where: {
                    role: 'regional_manager',
                    rmUniqueId: referralCode,
                },
            });

            if (regionalManager) {
                regionalManagerId = regionalManager.id;
            }
        }

        if (regionalManagerId) {
            const assignedUserCount = await this.usersRepository.count({
                where: {
                    rmId: regionalManagerId,
                    role: 'user',
                },
            });

            if (assignedUserCount >= 20) {
                throw new BadRequestException(
                    'The selected Regional Manager has reached their user limit.',
                );
            }
        }

        const password = await hash(dto.password, 10);
        const user = this.usersRepository.create({
            name: dto.name,
            email,
            mobileNumber: dto.mobile_number,
            password,
            referralCode,
            role: dto.role || 'user',
            rmId: regionalManagerId,
        });


        await this.usersRepository.save(user);
        const token = await this.issueJwtForUser(user);

        // Send welcome email
        await this.notificationService.sendWelcomeNotification(user);


        return {
            token,
            user: toUserResource(user),
        };
    }

    async sendOtp(identifier: string) {
        const normalizedIdentifier = normalizeIdentifier(identifier);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await this.otpRepository.save(
            this.otpRepository.create({
                identifier: normalizedIdentifier,
                otp,
                expiresAt,
            }),
        );

        if (normalizedIdentifier.includes('@')) {
            await this.notificationService.sendRegisterOtpNotification(
                normalizedIdentifier,
                otp,
            );
        } else {
            const formattedPhone = formatPhoneNumber(normalizedIdentifier);
            await this.notificationService.sendSms(
                formattedPhone,
                `Your K P Chaudhary & Co. verification code is: ${otp}. This code expires in 10 minutes.`,
            );
        }


        return this.devOnlyPayload({
            message: 'OTP sent successfully',
            otp,
        });
    }

    async verifyOtp(identifier: string, otp: string) {
        const normalizedIdentifier = normalizeIdentifier(identifier);
        const record = await this.otpRepository.findOne({
            where: { identifier: normalizedIdentifier, otp, verified: false },
            order: { createdAt: 'DESC' },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        record.verified = true;
        await this.otpRepository.save(record);

        return { success: true };
    }

    async forgotPassword(email: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.usersRepository.findOne({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return {};
        }

        const resetToken = randomToken(10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const appEnvironment =
            this.configService.getOrThrow<AppEnvironment>('app');
        const resetUrl = `${appEnvironment.frontendUrl}/reset-password/${resetToken}?email=${encodeURIComponent(normalizedEmail)}`;

        await this.otpRepository.save(
            this.otpRepository.create({
                identifier: `reset:${normalizedEmail}`,
                otp: resetToken,
                expiresAt,
            }),
        );

        await this.notificationService.sendEmail(
            normalizedEmail,
            'Reset your Doorstep password',
            'password-reset',
            {
                reset_url: resetUrl,
                token: resetToken,
            },
        );


        return this.devOnlyPayload({
            reset_token: resetToken,
            reset_url: resetUrl,
        });
    }

    async resetPassword(email: string, token: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const record = await this.otpRepository.findOne({
            where: {
                identifier: `reset:${normalizedEmail}`,
                otp: token,
                verified: false,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const user = await this.usersRepository.findOneOrFail({
            where: { email: normalizedEmail },
        });
        user.password = await hash(password, 10);
        await this.usersRepository.save(user);
        record.verified = true;
        await this.otpRepository.save(record);

        return { message: 'Password reset successfully' };
    }

    async sendLoginOtp(mobileNumber: string) {
        const user = await this.findUserByMobile(mobileNumber);

        if (!user) {
            throw new NotFoundException(
                'No account found with this mobile number. Please register first.',
            );
        }

        const normalizedMobile = normalizeMobileIdentifier(mobileNumber);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await this.otpRepository.save(
            this.otpRepository.create({
                identifier: normalizedMobile,
                otp,
                expiresAt,
            }),
        );

        const formattedPhone = formatPhoneNumber(mobileNumber);
        this.notificationService.sendSms(
            formattedPhone,
            `Your K P Chaudhary & Co. login code is: ${otp}. This code expires in 10 minutes.`,
        );

        return this.devOnlyPayload({
            message: 'OTP sent successfully to your mobile',
            otp,
        });
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

    logout() {
        return null;
    }

    private async issueJwtForUser(user: UserEntity) {
        const payload: JwtPayload = {
            email: user.email,
            role: user.role,
            sub: user.id,
        };

        return this.jwtService.signAsync(payload);
    }

    private async findUserByMobile(mobileNumber: string) {
        const normalizedMobile = normalizeMobileIdentifier(mobileNumber);

        return this.usersRepository
            .findOne({
                where: [{ mobileNumber }, { mobileNumber: normalizedMobile }],
            })
            .then(async (user) => {
                if (user) {
                    return user;
                }

                return this.usersRepository
                    .createQueryBuilder('user')
                    .where(
                        'REPLACE(REPLACE(user.mobile_number, "+", ""), " ", "") LIKE :mobile',
                        {
                            mobile: `%${normalizedMobile}`,
                        },
                    )
                    .getOne();
            });
    }

    private devOnlyPayload<T extends Record<string, unknown>>(data: T) {
        const appEnvironment =
            this.configService.getOrThrow<AppEnvironment>('app');

        return appEnvironment.nodeEnv === 'production' ? {} : data;
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
    return Math.random()
        .toString(36)
        .slice(2, 2 + length)
        .toUpperCase();
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
