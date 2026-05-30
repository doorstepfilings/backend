/**
 * Users seeder
 *
 * Seeds the four default system users:
 *   - super_admin
 *   - regional_manager  (gets a location-agnostic rmUniqueId)
 *   - accountant        (gets an accountantUniqueId)
 *   - user / customer   (assigned to the RM and accountant above)
 *
 * All operations are idempotent — safe to re-run on an existing database.
 */

import type { PrismaClient } from '@prisma/client';
import { UniqueIDGenerator } from '../../shared/utils/unique-id.generator';

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_USERS = [
  { email: 'admin@gmail.com', name: 'Super Admin', role: 'super_admin' },
  {
    email: 'rm@gmail.com',
    name: 'Relationship Manager',
    role: 'regional_manager',
  },
  { email: 'accountant@gmail.com', name: 'Accountant', role: 'accountant' },
  { email: 'user@gmail.com', name: 'Customer', role: 'user' },
] as const;

// ─── Seeder ───────────────────────────────────────────────────────────────────

/**
 * Upsert all default seed users.
 *
 * @param prisma        An active PrismaClient instance
 * @param hashedPassword Pre-hashed password to assign to every seeded user
 */
export async function seedUsers(
  prisma: PrismaClient,
  hashedPassword: string,
): Promise<void> {
  // ── Super admin ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      name: SEED_USERS[0].name,
      password: hashedPassword,
      role: SEED_USERS[0].role,
    },
    create: {
      email: 'admin@gmail.com',
      name: SEED_USERS[0].name,
      password: hashedPassword,
      role: SEED_USERS[0].role,
    },
  });

  // ── Regional Manager ─────────────────────────────────────────────────────
  const rm = await prisma.user.upsert({
    where: { email: 'rm@gmail.com' },
    update: {
      name: SEED_USERS[1].name,
      password: hashedPassword,
      role: SEED_USERS[1].role,
    },
    create: {
      email: 'rm@gmail.com',
      name: SEED_USERS[1].name,
      password: hashedPassword,
      role: SEED_USERS[1].role,
      rmUniqueId: UniqueIDGenerator.generateUserUniqueID('regional_manager'),
    },
  });

  // Backfill rmUniqueId if it was NULL before this seed run
  if (!rm.rmUniqueId) {
    await prisma.user.update({
      where: { id: rm.id },
      data: {
        rmUniqueId: UniqueIDGenerator.generateUserUniqueID('regional_manager'),
      },
    });
  }

  // ── Accountant ───────────────────────────────────────────────────────────
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@gmail.com' },
    update: {
      name: SEED_USERS[2].name,
      password: hashedPassword,
      role: SEED_USERS[2].role,
    },
    create: {
      email: 'accountant@gmail.com',
      name: SEED_USERS[2].name,
      password: hashedPassword,
      role: SEED_USERS[2].role,
      accountantUniqueId: UniqueIDGenerator.generateUserUniqueID('accountant'),
    },
  });

  // Backfill accountantUniqueId if it was NULL before this seed run
  if (!accountant.accountantUniqueId) {
    await prisma.user.update({
      where: { id: accountant.id },
      data: {
        accountantUniqueId:
          UniqueIDGenerator.generateUserUniqueID('accountant'),
      },
    });
  }

  // ── Customer (regular user) ───────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {
      name: SEED_USERS[3].name,
      password: hashedPassword,
      role: SEED_USERS[3].role,
      rmId: rm.id,
      accountantId: accountant.id,
    },
    create: {
      email: 'user@gmail.com',
      name: SEED_USERS[3].name,
      password: hashedPassword,
      role: SEED_USERS[3].role,
      rmId: rm.id,
      accountantId: accountant.id,
    },
  });

  console.log(
    `  ✓ Users seeded: ${admin.email}, ${rm.email}, ${accountant.email}, user@gmail.com`,
  );
}
