import { registerAs } from '@nestjs/config';

export type DatabaseConfig = {
    database: string;
    host: string;
    password: string;
    port: number;
    username: string;
};

export const databaseConfig = registerAs(
    'database',
    (): DatabaseConfig => ({
        database: process.env.DB_DATABASE!,
        host: process.env.DB_HOST!,
        password: process.env.DB_PASSWORD!,
        port: Number(process.env.DB_PORT!),
        username: process.env.DB_USERNAME!,
    }),
);