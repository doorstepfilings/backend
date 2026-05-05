import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { OtpVerificationEntity } from '../infrastructure/persistence/otp-verification.entity';
import { LoginDto } from '../presentation/http/dto/login.dto';
import { RegisterDto } from '../presentation/http/dto/register.dto';
import { NotificationService } from '../../communication/notification.service';
export declare class AuthService {
    private readonly usersRepository;
    private readonly otpRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly notificationService;
    constructor(usersRepository: Repository<UserEntity>, otpRepository: Repository<OtpVerificationEntity>, jwtService: JwtService, configService: ConfigService, notificationService: NotificationService);
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            referral_code: string | null;
            rm_id: number | null;
            accountant_id: number | null;
            role: string;
            rm_unique_id: string | null;
            accountant_unique_id: string | null;
            is_mobile_verified: boolean;
            address: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            created_at: Date;
            updated_at: Date;
            regional_manager: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                rm_unique_id: string | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                accountant_unique_id: string | null;
            } | null;
        };
    }>;
    getCurrentUser(userId: number): Promise<{
        id: number;
        name: string;
        email: string;
        mobile_number: string | null;
        referral_code: string | null;
        rm_id: number | null;
        accountant_id: number | null;
        role: string;
        rm_unique_id: string | null;
        accountant_unique_id: string | null;
        is_mobile_verified: boolean;
        address: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        created_at: Date;
        updated_at: Date;
        regional_manager: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            rm_unique_id: string | null;
        } | null;
        accountant: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            accountant_unique_id: string | null;
        } | null;
    }>;
    register(dto: RegisterDto): Promise<{
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            referral_code: string | null;
            rm_id: number | null;
            accountant_id: number | null;
            role: string;
            rm_unique_id: string | null;
            accountant_unique_id: string | null;
            is_mobile_verified: boolean;
            address: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            created_at: Date;
            updated_at: Date;
            regional_manager: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                rm_unique_id: string | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                accountant_unique_id: string | null;
            } | null;
        };
    }>;
    sendOtp(identifier: string): Promise<{}>;
    verifyOtp(identifier: string, otp: string): Promise<{
        success: boolean;
    }>;
    forgotPassword(email: string): Promise<{}>;
    resetPassword(email: string, token: string, password: string): Promise<{
        message: string;
    }>;
    sendLoginOtp(mobileNumber: string): Promise<{}>;
    loginWithMobile(mobileNumber: string, otp: string): Promise<{
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            referral_code: string | null;
            rm_id: number | null;
            accountant_id: number | null;
            role: string;
            rm_unique_id: string | null;
            accountant_unique_id: string | null;
            is_mobile_verified: boolean;
            address: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            created_at: Date;
            updated_at: Date;
            regional_manager: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                rm_unique_id: string | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                accountant_unique_id: string | null;
            } | null;
        };
    }>;
    logout(): null;
    private issueJwtForUser;
    private findUserByMobile;
    private devOnlyPayload;
}
