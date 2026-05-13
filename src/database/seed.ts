import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';
import servicesSeedData from './seed-data/services.seed-data';
import { createPrismaClientOptions } from '../shared/services/prisma-client-options';
import { UniqueIDGenerator } from '../shared/utils/unique-id.generator';

dotenv.config();

const prisma = new PrismaClient(createPrismaClientOptions());
const DEFAULT_PASSWORD = 'password';

if (process.env.NODE_ENV === 'production') {
    console.error(
        'Development seed is disabled in production. Use Prisma migrations plus `npm run migrate:legacy` for production data setup.',
    );
    process.exit(1);
}

type SeedCategory = {
    category: string;
    description?: string;
    icon?: string;
    services?: SeedService[];
    slug: string;
};

type SeedDocument = {
    description?: string;
    is_required?: boolean;
    isRequired?: boolean;
    name?: string;
};

type SeedFaq = {
    answer?: string;
    question?: string;
};

type SeedPricingPlan = {
    features?: string | string[];
    name?: string;
    price?: number | string | null;
};

type SeedService = {
    description?: string;
    faqs?: SeedFaq[];
    name: string;
    price?: number | string | null;
    pricing_plans?: SeedPricingPlan[];
    required_documents_list?: SeedDocument[];
    short_description?: string;
};

async function seed() {
    console.log('Connecting to database...');
    
    try {
        const hashedPassword = await hash(DEFAULT_PASSWORD, 10);

        console.log('Seeding users...');
        await seedUsers(hashedPassword);

        console.log('Seeding service catalog...');
        await seedServiceCatalog();

        const [userCount, categoryCount, serviceCount, documentCount] =
            await Promise.all([
                prisma.user.count(),
                prisma.serviceCategory.count(),
                prisma.service.count(),
                prisma.serviceDocument.count(),
            ]);

        console.log('\nSeeding completed successfully!');
        console.log(`Users: ${userCount}`);
        console.log(`Categories: ${categoryCount}`);
        console.log(`Services: ${serviceCount}`);
        console.log(`Service documents: ${documentCount}`);
        console.log(`Default password for seeded users: ${DEFAULT_PASSWORD}`);
    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
        console.log('Database connection closed.');
    }
}

async function seedUsers(hashedPassword: string) {
    const admin = await prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {
            name: 'Super Admin',
            password: hashedPassword,
            role: 'super_admin',
        },
        create: {
            name: 'Super Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'super_admin',
        },
    });

    const regionalManager = await prisma.user.upsert({
        where: { email: 'rm@gmail.com' },
        update: {
            name: 'Regional Manager',
            password: hashedPassword,
            role: 'regional_manager',
        },
        create: {
            name: 'Regional Manager',
            email: 'rm@gmail.com',
            password: hashedPassword,
            role: 'regional_manager',
            rmUniqueId: UniqueIDGenerator.generateUserUniqueID(
                'regional_manager',
            ),
        },
    });

    if (!regionalManager.rmUniqueId) {
        await prisma.user.update({
            where: { id: regionalManager.id },
            data: {
                rmUniqueId: UniqueIDGenerator.generateUserUniqueID(
                    'regional_manager',
                ),
            },
        });
    }

    const accountant = await prisma.user.upsert({
        where: { email: 'accountant@gmail.com' },
        update: {
            name: 'Accountant',
            password: hashedPassword,
            role: 'accountant',
        },
        create: {
            name: 'Accountant',
            email: 'accountant@gmail.com',
            password: hashedPassword,
            role: 'accountant',
            accountantUniqueId: UniqueIDGenerator.generateUserUniqueID(
                'accountant',
            ),
        },
    });

    if (!accountant.accountantUniqueId) {
        await prisma.user.update({
            where: { id: accountant.id },
            data: {
                accountantUniqueId:
                    UniqueIDGenerator.generateUserUniqueID('accountant'),
            },
        });
    }

    await prisma.user.upsert({
        where: { email: 'user@gmail.com' },
        update: {
            name: 'Customer',
            password: hashedPassword,
            role: 'user',
            rmId: regionalManager.id,
            accountantId: accountant.id,
        },
        create: {
            name: 'Customer',
            email: 'user@gmail.com',
            password: hashedPassword,
            role: 'user',
            rmId: regionalManager.id,
            accountantId: accountant.id,
        },
    });

    console.log(
        `Seeded users: ${admin.email}, ${regionalManager.email}, ${accountant.email}, user@gmail.com`,
    );
}

async function seedServiceCatalog() {
    for (const [categoryIndex, rawCategory] of (
        servicesSeedData as SeedCategory[]
    ).entries()) {
        const category = await prisma.serviceCategory.upsert({
            where: { slug: rawCategory.slug },
            update: {
                description: rawCategory.description ?? null,
                icon: rawCategory.icon ?? null,
                isActive: true,
                name: rawCategory.category,
                sortOrder: categoryIndex,
            },
            create: {
                description: rawCategory.description ?? null,
                icon: rawCategory.icon ?? null,
                isActive: true,
                name: rawCategory.category,
                slug: rawCategory.slug,
                sortOrder: categoryIndex,
            },
        });

        for (const rawService of rawCategory.services ?? []) {
            const slug = slugify(rawService.name);
            const pricingPlans = normalizePricingPlans(
                rawService.pricing_plans,
            );
            const faqs = normalizeFaqs(rawService.faqs);
            const requiredDocuments = normalizeRequiredDocuments(
                rawService.required_documents_list,
            );
            const servicePayload = {
                adminNotes: null,
                description:
                    rawService.description ??
                    `Professional ${rawService.name} services.`,
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
                serviceCategoryId: category.id,
                serviceCode: null,
                serviceType: 'standard',
                shortDescription: rawService.short_description ?? null,
            };
            const existingService = await prisma.service.findUnique({
                where: { slug },
            });
            const service = existingService
                ? await prisma.service.update({
                      where: { id: existingService.id },
                      data: servicePayload,
                  })
                : await prisma.service.create({
                      data: {
                          ...servicePayload,
                          slug,
                      },
                  });

            await prisma.serviceDocument.deleteMany({
                where: { serviceId: service.id },
            });

            if (requiredDocuments.length > 0) {
                await prisma.serviceDocument.createMany({
                    data: requiredDocuments.map((document, index) => ({
                        description: document.description ?? null,
                        documentName: document.name ?? null,
                        documentType: document.is_required ? 'required' : 'optional',
                        fileType: 'pdf',
                        isRequired: Boolean(document.is_required),
                        maxSize: 5,
                        name: document.name ?? null,
                        serviceId: service.id,
                        slug: document.name ? slugify(document.name) : null,
                        sortOrder: index,
                    })),
                });
            }
        }
    }
}

function normalizeFaqs(faqs: SeedFaq[] | undefined) {
    return Array.isArray(faqs) ? faqs : [];
}

function normalizePricingPlans(plans: SeedPricingPlan[] | undefined) {
    return Array.isArray(plans) ? plans : [];
}

function normalizeRequiredDocuments(documents: SeedDocument[] | undefined) {
    if (!Array.isArray(documents)) {
        return [];
    }

    return documents.map((document) => ({
        description: document.description ?? null,
        is_required: Boolean(
            document.is_required ?? document.isRequired ?? false,
        ),
        name: document.name ?? 'Document',
    }));
}

function slugify(value: string) {
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

function toDecimalValue(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return String(value);
}

seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
});
