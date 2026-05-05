import { Repository } from 'typeorm';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { ChangePasswordDto } from '../presentation/http/dto/change-password.dto';
import { UpdateProfileDto } from '../presentation/http/dto/update-profile.dto';
export declare class ProfileService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<UserEntity>);
    searchRegionalManager(rmUniqueId: string): Promise<{
        id: number;
        name: string;
        email: string;
        mobile_number: string | null;
        rm_unique_id: string | null;
    }>;
    connectRegionalManager(userId: number, rmUniqueId: string): Promise<{
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
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
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
    changePassword(userId: number, dto: ChangePasswordDto): Promise<null>;
}
