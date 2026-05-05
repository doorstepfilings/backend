import { AuthService } from '../../application/auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginWithMobileDto } from './dto/login-with-mobile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendLoginOtpDto } from './dto/send-login-otp.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    forgotPassword(body: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
        data: {};
    }>;
    resetPassword(body: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
        data: {
            message: string;
        };
    }>;
    sendOtp(body: SendOtpDto): Promise<{
        success: boolean;
        message: string;
        data: {};
    }>;
    verifyOtp(body: VerifyOtpDto): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    sendLoginOtp(body: SendLoginOtpDto): Promise<{
        success: boolean;
        message: string;
        data: {};
    }>;
    loginWithMobile(body: LoginWithMobileDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getCurrentUser(authUser: {
        userId: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
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
    logout(): {
        success: boolean;
        message: string;
        data: null;
    };
}
