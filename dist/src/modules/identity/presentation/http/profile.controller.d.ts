import { ProfileService } from '../../application/profile.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConnectRmDto } from './dto/connect-rm.dto';
import { SearchRmDto } from './dto/search-rm.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    searchRegionalManagerPublic(query: SearchRmDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            rm_unique_id: string | null;
        };
    }>;
    searchRegionalManagerPrivate(query: SearchRmDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            name: string;
            email: string;
            mobile_number: string | null;
            rm_unique_id: string | null;
        };
    }>;
    connectRegionalManager(authUser: {
        userId: number;
    }, body: ConnectRmDto): Promise<{
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
    updateProfile(authUser: {
        userId: number;
    }, body: UpdateProfileDto): Promise<{
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
    changePassword(authUser: {
        userId: number;
    }, body: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
}
