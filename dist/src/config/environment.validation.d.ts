declare class EnvironmentVariables {
    NODE_ENV: string;
    APP_NAME: string;
    PORT: number;
    API_PREFIX: string;
    FRONTEND_URL: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    MAIL_HOST: string;
    MAIL_PORT: number;
    MAIL_USER: string;
    MAIL_PASS: string;
    MAIL_FROM: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
}
export declare function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables;
export {};
