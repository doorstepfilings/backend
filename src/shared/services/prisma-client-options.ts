import type { Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getPrimaryDatabaseConfig } from '../../config/database-env';

export function createPrismaClientOptions(): Prisma.PrismaClientOptions {
    const database = getPrimaryDatabaseConfig();

    const pool = new Pool({
        host: database.host,
        port: database.port,
        user: database.username,
        password: database.password,
        database: database.database,
        max: database.connectionLimit,
    });

    return {
        adapter: new PrismaPg(pool),
    };
}
