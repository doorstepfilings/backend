export declare class OtpVerificationEntity {
    id: number;
    identifier: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
    createdAt: Date;
}
