export type AuthConfig = {
    jwtExpiresIn: string;
    jwtSecret: string;
};
export declare const authConfig: (() => AuthConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AuthConfig>;
