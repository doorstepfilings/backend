import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/shared/services/prisma-client-options';
import { resetPostgresSequences } from './lib/legacy-migration';

async function main() {
    const prisma = new PrismaClient(createPrismaClientOptions());
    try {
        await prisma.$connect();
        await resetPostgresSequences(prisma);
        console.log('[reset-sequences] PostgreSQL sequence synchronization complete.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('[reset-sequences] Sequence reset failed.');
    console.error(error);
    process.exit(1);
});
