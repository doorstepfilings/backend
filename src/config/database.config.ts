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
        host: process.env.DB_HOST as string,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME as string,
        password: process.env.DB_PASSWORD as string,
        database: process.env.DB_DATABASE as string,
    }),
);