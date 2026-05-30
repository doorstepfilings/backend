/**
 * Database seed orchestrator
 *
 * Runs all seeders in dependency order and prints a summary on completion.
 * Disabled in production to prevent accidental data overwrites.
 *
 * Usage:
 *   npm run seed
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';

import { createPrismaClientOptions } from '../shared/services/prisma-client-options';
import { seedUsers } from './seeders/users.seeder';
import { seedServiceCatalog } from './seeders/service-catalog.seeder';

dotenv.config();

// ─── Guard: no seeds in production ───────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  console.error(
    'Development seed is disabled in production. ' +
      'Use Prisma migrations plus `npm run migrate:legacy` for production data setup.',
  );
  process.exit(1);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PASSWORD = 'password';

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const prisma = new PrismaClient(createPrismaClientOptions());

  console.log('🌱 Starting database seed...\n');

  try {
    const hashedPassword = await hash(DEFAULT_PASSWORD, 10);

    console.log('Seeding users...');
    await seedUsers(prisma, hashedPassword);

    console.log('Seeding service catalog...');
    await seedServiceCatalog(prisma);

    // ── Summary ──────────────────────────────────────────────────────────
    const [userCount, categoryCount, serviceCount, documentCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.serviceCategory.count(),
        prisma.service.count(),
        prisma.serviceDocument.count(),
      ]);

    console.log('\n✅ Seeding completed successfully!');
    console.log(`   Users            : ${userCount}`);
    console.log(`   Categories       : ${categoryCount}`);
    console.log(`   Services         : ${serviceCount}`);
    console.log(`   Service documents: ${documentCount}`);
    console.log(`   Default password : ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('\nDatabase connection closed.');
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

seed().catch((error) => {
  console.error('Fatal error during seeding:', error);
  process.exit(1);
});
