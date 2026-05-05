import { registerAs } from '@nestjs/config';

export type AuthConfig = {
    jwtExpiresIn: string;
    jwtSecret: string;
};

export const authConfig = registerAs(
    'auth',
    (): AuthConfig => ({
        jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
        jwtSecret: process.env.JWT_SECRET ?? 'change-me-before-production',
    }),
);
