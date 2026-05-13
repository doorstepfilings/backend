import type { Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getPrimaryDatabaseConfig } from '../../config/database-env';

export function createPrismaClientOptions(): Prisma.PrismaClientOptions {
    const database = getPrimaryDatabaseConfig();

    return {
        adapter: new PrismaMariaDb({
            host: database.host,
            port: database.port,
            user: database.username,
            password: database.password,
            database: database.database,
            connectionLimit: database.connectionLimit,
        }),
    };
}
