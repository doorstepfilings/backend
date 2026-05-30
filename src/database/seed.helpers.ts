/**
 * Seed helper utilities
 *
 * Pure, stateless functions shared across all seed runners.
 * No Prisma or NestJS dependencies — safe to unit-test in isolation.
 */

import type { SeedDocument, SeedFaq, SeedPricingPlan } from './seed.types';

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Convert any human-readable string into a URL-safe slug.
 *
 * Rules applied in order:
 *  1. Lowercase everything
 *  2. Replace `&` with "and"
 *  3. Replace `@` and `%` with a space
 *  4. Drop `(` and `)`
 *  5. Replace `/` with a space
 *  6. Collapse all remaining non-alphanumeric runs to a single `-`
 *  7. Strip leading / trailing hyphens
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[@%]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/[/]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a price value to the string format Prisma expects for `Decimal`
 * columns.  Returns `null` for empty / missing values so the DB column is
 * left as NULL rather than the string `"null"`.
 */
export function toDecimalValue(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

/**
 * Ensure FAQs is always an array, even when the seed data omits the field.
 */
export function normalizeFaqs(faqs: SeedFaq[] | undefined): SeedFaq[] {
  return Array.isArray(faqs) ? faqs : [];
}

/**
 * Ensure pricing plans is always an array, even when the seed data omits the
 * field.
 */
export function normalizePricingPlans(
  plans: SeedPricingPlan[] | undefined,
): SeedPricingPlan[] {
  return Array.isArray(plans) ? plans : [];
}

/**
 * Normalise the raw required-documents list from seed data into a consistent
 * shape.  Handles both `is_required` (snake_case) and `isRequired`
 * (camelCase) variants that appear in the source data.
 */
export function normalizeRequiredDocuments(
  documents: SeedDocument[] | undefined,
): Array<{ description: string | null; is_required: boolean; name: string }> {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents.map((doc) => ({
    description: doc.description ?? null,
    is_required: Boolean(doc.is_required ?? doc.isRequired ?? false),
    name: doc.name ?? 'Document',
  }));
}
