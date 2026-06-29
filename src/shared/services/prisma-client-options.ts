import type { Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { getPrimaryDatabaseConfig, getPrismaDatabaseUrl } from '../../config/database-env';

declare global {
    var prismaPgPool: Pool | undefined;
    var prismaPgAdapter: PrismaPg | undefined;
}

export function createPrismaClientOptions(): Prisma.PrismaClientOptions {
    if (!globalThis.prismaPgPool) {
        const connectionString = getPrismaDatabaseUrl();
        const database = getPrimaryDatabaseConfig();

        globalThis.prismaPgPool = new Pool({
            connectionString,
            max: database.connectionLimit,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        globalThis.prismaPgAdapter = new PrismaPg(globalThis.prismaPgPool);
    }

    return {
        adapter: globalThis.prismaPgAdapter,
    };
}

