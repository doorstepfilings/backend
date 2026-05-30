import { registerAs } from '@nestjs/config';

export type AppEnvironment = {
  apiPrefix: string;
  appName: string;
  appUrl: string;
  frontendUrl: string;
  nodeEnv: string;
  port: number;
  socialAuthSharedSecret?: string;
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
    encryption: string;
  };
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
    appUrl: process.env.APP_URL as string,
    frontendUrl: process.env.FRONTEND_URL as string,
    nodeEnv: process.env.NODE_ENV as string,
    port: Number(process.env.PORT || 4000),
    socialAuthSharedSecret: process.env.SOCIAL_AUTH_SHARED_SECRET,
    mail: {
      host: process.env.MAIL_HOST as string,
      port: Number(process.env.MAIL_PORT || 587),
      user: process.env.MAIL_USERNAME as string,
      pass: process.env.MAIL_PASSWORD as string,
      from: process.env.MAIL_FROM_ADDRESS as string,
      fromName: process.env.MAIL_FROM_NAME as string,
      encryption: process.env.MAIL_ENCRYPTION as string,
    },
    twilio: {
      sid: process.env.TWILIO_SID as string,
      token: process.env.TWILIO_AUTH_TOKEN as string,
      number: process.env.TWILIO_NUMBER as string,
    },
  }),
);
