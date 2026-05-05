export type DatabaseConfig = {
    database: string;
    host: string;
    password: string;
    port: number;
    username: string;
};
export declare const databaseConfig: (() => DatabaseConfig) & import("@nestjs/config").ConfigFactoryKeyHost<DatabaseConfig>;
