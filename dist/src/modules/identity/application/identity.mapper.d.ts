import { UserEntity } from '../infrastructure/persistence/user.entity';
export declare function toUserResource(user: UserEntity): {
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
