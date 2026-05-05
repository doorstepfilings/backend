"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const typeorm_2 = require("typeorm");
const bcryptjs_1 = require("bcryptjs");
const user_entity_1 = require("../infrastructure/persistence/user.entity");
const otp_verification_entity_1 = require("../infrastructure/persistence/otp-verification.entity");
const identity_mapper_1 = require("./identity.mapper");
const notification_service_1 = require("../../communication/notification.service");
let AuthService = class AuthService {
    usersRepository;
    otpRepository;
    jwtService;
    configService;
    notificationService;
    constructor(usersRepository, otpRepository, jwtService, configService, notificationService) {
        this.usersRepository = usersRepository;
        this.otpRepository = otpRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationService = notificationService;
    }
    async login(loginDto) {
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
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const passwordMatches = await (0, bcryptjs_1.compare)(loginDto.password, normalizePasswordHash(user.password));
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const payload = {
            email: user.email,
            role: user.role,
            sub: user.id,
        };
        const token = await this.jwtService.signAsync(payload);
        return {
            token,
            user: (0, identity_mapper_1.toUserResource)(user),
        };
    }
    async getCurrentUser(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return (0, identity_mapper_1.toUserResource)(user);
    }
    async register(dto) {
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
            throw new common_1.BadRequestException('Email not verified. Please verify with OTP first.');
        }
        const existing = await this.usersRepository.findOne({
            where: [{ email }, { mobileNumber: dto.mobile_number }],
        });
        if (existing) {
            throw new common_1.ConflictException('User already exists');
        }
        let regionalManagerId = null;
        let referralCode = dto.referral_code ?? null;
        if (dto.rm_id) {
            const regionalManager = await this.usersRepository.findOne({
                where: {
                    role: 'regional_manager',
                    rmUniqueId: dto.rm_id,
                },
            });
            if (!regionalManager) {
                throw new common_1.BadRequestException('Invalid Regional Manager ID.');
            }
            regionalManagerId = regionalManager.id;
        }
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
                throw new common_1.BadRequestException('The selected Regional Manager has reached their user limit.');
            }
        }
        const password = await (0, bcryptjs_1.hash)(dto.password, 10);
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
        this.notificationService.sendWelcomeNotification(user);
        return {
            token,
            user: (0, identity_mapper_1.toUserResource)(user),
        };
    }
    async sendOtp(identifier) {
        const normalizedIdentifier = normalizeIdentifier(identifier);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.otpRepository.save(this.otpRepository.create({
            identifier: normalizedIdentifier,
            otp,
            expiresAt,
        }));
        if (normalizedIdentifier.includes('@')) {
            this.notificationService.sendRegisterOtpNotification(normalizedIdentifier, otp);
        }
        else {
            const formattedPhone = formatPhoneNumber(normalizedIdentifier);
            this.notificationService.sendSms(formattedPhone, `Your K P Chaudhary & Co. verification code is: ${otp}. This code expires in 10 minutes.`);
        }
        return this.devOnlyPayload({
            message: 'OTP sent successfully',
            otp,
        });
    }
    async verifyOtp(identifier, otp) {
        const normalizedIdentifier = normalizeIdentifier(identifier);
        const record = await this.otpRepository.findOne({
            where: { identifier: normalizedIdentifier, otp, verified: false },
            order: { createdAt: 'DESC' },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        record.verified = true;
        await this.otpRepository.save(record);
        return { success: true };
    }
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.usersRepository.findOne({
            where: { email: normalizedEmail },
        });
        if (!user) {
            return {};
        }
        const resetToken = randomToken(10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const appEnvironment = this.configService.getOrThrow('app');
        const resetUrl = `${appEnvironment.frontendUrl}/reset-password/${resetToken}?email=${encodeURIComponent(normalizedEmail)}`;
        await this.otpRepository.save(this.otpRepository.create({
            identifier: `reset:${normalizedEmail}`,
            otp: resetToken,
            expiresAt,
        }));
        this.notificationService.sendEmail(normalizedEmail, 'Reset your Doorstep password', 'password-reset', {
            reset_url: resetUrl,
            token: resetToken,
        });
        return this.devOnlyPayload({
            reset_token: resetToken,
            reset_url: resetUrl,
        });
    }
    async resetPassword(email, token, password) {
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
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const user = await this.usersRepository.findOneOrFail({
            where: { email: normalizedEmail },
        });
        user.password = await (0, bcryptjs_1.hash)(password, 10);
        await this.usersRepository.save(user);
        record.verified = true;
        await this.otpRepository.save(record);
        return { message: 'Password reset successfully' };
    }
    async sendLoginOtp(mobileNumber) {
        const user = await this.findUserByMobile(mobileNumber);
        if (!user) {
            throw new common_1.NotFoundException('No account found with this mobile number. Please register first.');
        }
        const normalizedMobile = normalizeMobileIdentifier(mobileNumber);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.otpRepository.save(this.otpRepository.create({
            identifier: normalizedMobile,
            otp,
            expiresAt,
        }));
        const formattedPhone = formatPhoneNumber(mobileNumber);
        this.notificationService.sendSms(formattedPhone, `Your K P Chaudhary & Co. login code is: ${otp}. This code expires in 10 minutes.`);
        return this.devOnlyPayload({
            message: 'OTP sent successfully to your mobile',
            otp,
        });
    }
    async loginWithMobile(mobileNumber, otp) {
        const normalizedMobile = normalizeMobileIdentifier(mobileNumber);
        await this.verifyOtp(normalizedMobile, otp);
        const user = await this.findUserByMobile(normalizedMobile);
        if (!user) {
            throw new common_1.NotFoundException('No account found with this mobile number. Please register first.');
        }
        return {
            token: await this.issueJwtForUser(user),
            user: (0, identity_mapper_1.toUserResource)(user),
        };
    }
    logout() {
        return null;
    }
    async issueJwtForUser(user) {
        const payload = {
            email: user.email,
            role: user.role,
            sub: user.id,
        };
        return this.jwtService.signAsync(payload);
    }
    async findUserByMobile(mobileNumber) {
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
                .where('REPLACE(REPLACE(user.mobile_number, "+", ""), " ", "") LIKE :mobile', {
                mobile: `%${normalizedMobile}`,
            })
                .getOne();
        });
    }
    devOnlyPayload(data) {
        const appEnvironment = this.configService.getOrThrow('app');
        return appEnvironment.nodeEnv === 'production' ? {} : data;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(otp_verification_entity_1.OtpVerificationEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        notification_service_1.NotificationService])
], AuthService);
function normalizePasswordHash(hash) {
    return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
}
function normalizeMobileIdentifier(identifier) {
    const digits = identifier.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
}
function normalizeIdentifier(identifier) {
    return identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : normalizeMobileIdentifier(identifier);
}
function randomToken(length) {
    return Math.random()
        .toString(36)
        .slice(2, 2 + length)
        .toUpperCase();
}
function formatPhoneNumber(mobileNumber) {
    const digitsOnly = mobileNumber.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return `+${digitsOnly}`;
    }
    else if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
        return `+91${digitsOnly}`;
    }
    return `+${digitsOnly}`;
}
//# sourceMappingURL=auth.service.js.map