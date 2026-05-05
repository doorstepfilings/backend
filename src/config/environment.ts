import { registerAs } from '@nestjs/config';

export type AppEnvironment = {
    apiPrefix: string;
    appName: string;
    frontendUrl: string;
    nodeEnv: string;
    port: number;
    twilio: {
        sid: string;
        token: string;
        number: string;
    };
};

export const appEnvironment = registerAs(
    'app',
    (): AppEnvironment => ({
        apiPrefix: process.env.API_PREFIX ?? 'api',
        appName: process.env.APP_NAME ?? 'doorstep-backend',
        frontendUrl: process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000',
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: Number(process.env.PORT ?? 4000),
        twilio: {
            sid: process.env.TWILIO_SID ?? '',
            token: process.env.TWILIO_AUTH_TOKEN ?? '',
            number: process.env.TWILIO_NUMBER ?? '',
        },
    }),
);
