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
        apiPrefix: process.env.API_PREFIX as string,
        appName: process.env.APP_NAME as string,
        frontendUrl: process.env.FRONTEND_URL as string,
        nodeEnv: process.env.NODE_ENV as string,
        port: Number(process.env.PORT || 4000),
        twilio: {
            sid: process.env.TWILIO_SID as string,
            token: process.env.TWILIO_AUTH_TOKEN as string,
            number: process.env.TWILIO_NUMBER as string,
        },
    }),
);
