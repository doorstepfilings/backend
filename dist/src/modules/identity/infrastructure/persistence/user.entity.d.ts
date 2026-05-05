export declare class UserEntity {
    id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    mobileNumber: string | null;
    isMobileVerified: boolean;
    referralCode: string | null;
    rmUniqueId: string | null;
    accountantUniqueId: string | null;
    rmId: number | null;
    accountantId: number | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    regionalManager: UserEntity | null;
    assignedUsers: UserEntity[];
    accountant: UserEntity | null;
    assignedAccountantUsers: UserEntity[];
    createdAt: Date;
    updatedAt: Date;
}
