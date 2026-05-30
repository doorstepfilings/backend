/**
 * Service catalog seeder
 *
 * Iterates over the auto-generated `services.seed-data` array and upserts
 * every category, service, and service-document into the database.
 *
 * All operations are idempotent — safe to re-run on an existing database.
 */

import type { PrismaClient } from '@prisma/client';
import servicesSeedData from '../seed-data/services.seed-data';
import type { SeedCategory, SeedService } from '../seed.types';
import {
  normalizeFaqs,
  normalizePricingPlans,
  normalizeRequiredDocuments,
  slugify,
  toDecimalValue,
} from '../seed.helpers';

// ─── Seeder ───────────────────────────────────────────────────────────────────

/**
 * Upsert all service categories, services, and related documents.
 *
 * @param prisma An active PrismaClient instance
 */
export async function seedServiceCatalog(prisma: PrismaClient): Promise<void> {
  let categoryCount = 0;
  let serviceCount = 0;

  for (const [categoryIndex, rawCategory] of (
    servicesSeedData as SeedCategory[]
  ).entries()) {
    const category = await upsertCategory(prisma, rawCategory, categoryIndex);
    categoryCount += 1;

    for (const rawService of rawCategory.services ?? []) {
      await upsertService(prisma, rawService, category.id);
      serviceCount += 1;
    }
  }

  console.log(
    `  ✓ Catalog seeded: ${categoryCount} categories, ${serviceCount} services`,
  );
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function upsertCategory(
  prisma: PrismaClient,
  rawCategory: SeedCategory,
  sortOrder: number,
) {
  return prisma.serviceCategory.upsert({
    where: { slug: rawCategory.slug },
    update: {
      description: rawCategory.description ?? null,
      icon: rawCategory.icon ?? null,
      isActive: true,
      name: rawCategory.category,
      sortOrder,
    },
    create: {
      description: rawCategory.description ?? null,
      icon: rawCategory.icon ?? null,
      isActive: true,
      name: rawCategory.category,
      slug: rawCategory.slug,
      sortOrder,
    },
  });
}

async function upsertService(
  prisma: PrismaClient,
  rawService: SeedService,
  serviceCategoryId: number,
) {
  const slug = slugify(rawService.name);
  const pricingPlans = normalizePricingPlans(rawService.pricing_plans);
  const faqs = normalizeFaqs(rawService.faqs);
  const requiredDocuments = normalizeRequiredDocuments(
    rawService.required_documents_list,
  );

  const servicePayload = {
    adminNotes: null,
    description:
      rawService.description ?? `Professional ${rawService.name} services.`,
    extraDocuments: [],
    faqs,
    gstPercentage: '18.00',
    isActive: true,
    isFeatured: false,
    isPopular: false,
    link: `/service/${slug}`,
    longDescription: rawService.description ?? null,
    name: rawService.name,
    price: toDecimalValue(rawService.price),
    pricingPlans,
    processingDays: 7,
    requiredDocumentsList: requiredDocuments,
    serviceCategoryId,
    serviceCode: null,
    serviceType: 'standard',
    shortDescription: rawService.short_description ?? null,
  };

  // Use findUnique + create/update because the service table may not have a
  // unique constraint on slug that Prisma can use in an upsert directly.
  const existing = await prisma.service.findUnique({ where: { slug } });
  const service = existing
    ? await prisma.service.update({
        where: { id: existing.id },
        data: servicePayload,
      })
    : await prisma.service.create({
        data: { ...servicePayload, slug },
      });

  // Always replace documents so changes to the seed data are reflected on
  // re-runs without leaving stale entries.
  await prisma.serviceDocument.deleteMany({ where: { serviceId: service.id } });

  if (requiredDocuments.length > 0) {
    await prisma.serviceDocument.createMany({
      data: requiredDocuments.map((doc, index) => ({
        description: doc.description ?? null,
        documentName: doc.name ?? null,
        documentType: doc.is_required ? 'required' : 'optional',
        fileType: 'pdf',
        isRequired: doc.is_required,
        maxSize: 5,
        name: doc.name ?? null,
        serviceId: service.id,
        slug: doc.name ? slugify(doc.name) : null,
        sortOrder: index,
      })),
    });
  }
}
