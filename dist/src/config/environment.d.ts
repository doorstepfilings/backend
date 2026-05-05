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
export declare const appEnvironment: (() => AppEnvironment) & import("@nestjs/config").ConfigFactoryKeyHost<AppEnvironment>;
