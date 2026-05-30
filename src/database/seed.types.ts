/**
 * Seed layer type definitions
 *
 * All types used across seeders are declared here so that:
 *  - Each seeder file imports from one canonical place
 *  - The seed data file (services.seed-data.ts) is typed consistently
 *  - Adding a new field only requires a change in this file
 */

export type SeedDocument = {
  description?: string;
  /** Preferred field name coming from JSON seed data */
  is_required?: boolean;
  /** Alternate field name (legacy / camelCase variant) */
  isRequired?: boolean;
  name?: string;
};

export type SeedFaq = {
  answer?: string;
  question?: string;
};

export type SeedPricingPlan = {
  features?: string | string[];
  name?: string;
  price?: number | string | null;
};

export type SeedService = {
  description?: string;
  faqs?: SeedFaq[];
  name: string;
  price?: number | string | null;
  pricing_plans?: SeedPricingPlan[];
  required_documents_list?: SeedDocument[];
  short_description?: string;
};

export type SeedCategory = {
  category: string;
  description?: string;
  icon?: string;
  services?: SeedService[];
  slug: string;
};
