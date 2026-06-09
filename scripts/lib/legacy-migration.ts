import { Prisma, PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';
import {
    assertDifferentDatabases,
    describeDatabaseConnection,
    getLegacyDatabaseConfig,
    getPrimaryDatabaseConfig,
} from '../../src/config/database-env';
import { normalizeLegacyUserServicePaymentStatus } from '../../src/modules/operations/application/user-service-status';
import { createPrismaClientOptions } from '../../src/shared/services/prisma-client-options';

type LegacyRow = Record<string, unknown>;
type StageSummary = {
    migratedRows: number;
    sourceCount: number;
    table: string;
    targetCount: number;
};
type SkippedLegacyTableSummary = {
    reason: string;
    sourceCount: number;
    table: string;
};
type TableName =
    | 'enquiries'
    | 'payments'
    | 'service_categories'
    | 'service_documents'
    | 'service_request_documents'
    | 'services'
    | 'user_services'
    | 'users';

const REQUIRED_TABLES: readonly TableName[] = [
    'service_categories',
    'services',
    'service_documents',
    'users',
    'enquiries',
    'user_services',
    'service_request_documents',
    'payments',
];

const SOURCE_COUNT_QUERIES: Record<TableName, string> = {
    enquiries: 'SELECT COUNT(*) AS count FROM enquiries',
    payments: 'SELECT COUNT(*) AS count FROM payments',
    service_categories: 'SELECT COUNT(*) AS count FROM service_categories',
    service_documents: 'SELECT COUNT(*) AS count FROM service_documents',
    service_request_documents:
        'SELECT COUNT(*) AS count FROM service_request_documents',
    services: 'SELECT COUNT(*) AS count FROM services',
    user_services: 'SELECT COUNT(*) AS count FROM user_services',
    users: 'SELECT COUNT(*) AS count FROM users',
};

const SKIPPED_LEGACY_TABLE_REASONS: Record<string, string> = {
    audit_logs:
        'Legacy audit trail table. Not modeled in the fresh Prisma schema yet.',
    cache:
        'Laravel runtime cache table. Do not migrate into the Prisma app database.',
    cache_locks:
        'Laravel runtime lock table. Do not migrate into the Prisma app database.',
    failed_jobs:
        'Laravel queue failure table. Do not migrate into the Prisma app database.',
    job_batches:
        'Laravel queue batch table. Do not migrate into the Prisma app database.',
    jobs: 'Laravel queue jobs table. Do not migrate into the Prisma app database.',
    media:
        'Legacy media library table. Not modeled in the fresh Prisma schema yet.',
    migrations:
        'Laravel migration history. Prisma manages its own _prisma_migrations table.',
    notifications:
        'Legacy persisted notifications table. Not modeled in the fresh Prisma schema yet.',
    oauth_access_tokens:
        'Laravel Passport auth table. Do not migrate into the Prisma app database.',
    oauth_auth_codes:
        'Laravel Passport auth table. Do not migrate into the Prisma app database.',
    oauth_clients:
        'Laravel Passport auth table. Do not migrate into the Prisma app database.',
    oauth_device_codes:
        'Laravel Passport auth table. Do not migrate into the Prisma app database.',
    oauth_refresh_tokens:
        'Laravel Passport auth table. Do not migrate into the Prisma app database.',
    otp_verifications:
        'Intentionally skipped so the fresh Prisma app starts with a clean OTP state.',
    password_reset_tokens:
        'Legacy password reset table. Do not migrate into the Prisma app database.',
    password_resets:
        'Legacy password reset table. Do not migrate into the Prisma app database.',
    personal_access_tokens:
        'Laravel personal access token table. Do not migrate into the Prisma app database.',
    sessions:
        'Laravel session table. Do not migrate into the Prisma app database.',
    system_settings:
        'Legacy settings table. Not modeled in the fresh Prisma schema yet.',
};

type LegacyServiceCategoryRow = {
    description: unknown;
    icon: unknown;
    id: unknown;
    is_active: unknown;
    name: unknown;
    slug: unknown;
    sort_order: unknown;
};

type LegacyServiceRow = {
    admin_notes: unknown;
    description: unknown;
    extra_documents: unknown;
    faqs: unknown;
    features: unknown;
    gst_percentage: unknown;
    id: unknown;
    is_active: unknown;
    is_featured: unknown;
    is_popular: unknown;
    link: unknown;
    long_description: unknown;
    metadata: unknown;
    name: unknown;
    price: unknown;
    pricing_plans: unknown;
    process: unknown;
    processing_days: unknown;
    required_documents_list: unknown;
    requirements: unknown;
    service_category_id: unknown;
    service_code: unknown;
    service_type: unknown;
    short_description: unknown;
    slug: unknown;
};

type LegacyServiceDocumentRow = {
    description: unknown;
    document_name: unknown;
    document_type: unknown;
    file_type: unknown;
    id: unknown;
    is_required: unknown;
    max_size: unknown;
    metadata: unknown;
    name: unknown;
    service_id: unknown;
    slug: unknown;
    sort_order: unknown;
};

type LegacyUserRow = {
    accountant_id: unknown;
    accountant_unique_id: unknown;
    address: unknown;
    city: unknown;
    created_at: unknown;
    email: unknown;
    id: unknown;
    is_mobile_verified: unknown;
    mobile: unknown;
    mobile_number: unknown;
    name: unknown;
    password: unknown;
    pincode: unknown;
    referral_code: unknown;
    rm_id: unknown;
    rm_unique_id: unknown;
    role: unknown;
    state: unknown;
    unique_id: unknown;
    updated_at: unknown;
};

type LegacyEnquiryRow = {
    created_at: unknown;
    email: unknown;
    id: unknown;
    message: unknown;
    mobile: unknown;
    name: unknown;
    phone: unknown;
    service: unknown;
    service_type: unknown;
    status: unknown;
    updated_at: unknown;
};

type LegacyUserServiceRow = {
    accountant_id: unknown;
    amount: unknown;
    application_unique_id: unknown;
    assigned_accountant_id: unknown;
    ca_notes: unknown;
    certificate_url: unknown;
    created_at: unknown;
    documents: unknown;
    form_data: unknown;
    id: unknown;
    notes: unknown;
    payment_status: unknown;
    rejection_reason: unknown;
    revision_notes: unknown;
    service_id: unknown;
    status: unknown;
    submitted_to_ca_at: unknown;
    update_note: unknown;
    updated_at: unknown;
    user_id: unknown;
    verified: unknown;
};

type LegacyServiceRequestDocumentRow = {
    created_at: unknown;
    document_category: unknown;
    document_name: unknown;
    document_type: unknown;
    file_extension: unknown;
    file_name: unknown;
    file_path: unknown;
    file_size: unknown;
    id: unknown;
    is_final: unknown;
    mime_type: unknown;
    notes: unknown;
    service_document_id: unknown;
    source_document_id: unknown;
    status: unknown;
    updated_at: unknown;
    uploaded_by: unknown;
    user_service_id: unknown;
    version: unknown;
};

type LegacyPaymentRow = {
    amount: unknown;
    base_amount: unknown;
    created_at: unknown;
    currency: unknown;
    gst_amount: unknown;
    id: unknown;
    invoice_unique_id: unknown;
    metadata: unknown;
    notes: unknown;
    order_unique_id: unknown;
    payment_date: unknown;
    payment_gateway_error: unknown;
    payment_gateway_response: unknown;
    payment_method: unknown;
    payment_provider: unknown;
    payment_provider_order_id: unknown;
    payment_provider_status: unknown;
    payment_provider_transaction_id: unknown;
    payment_reference: unknown;
    payment_status: unknown;
    payment_verified_at: unknown;
    refund_amount: unknown;
    refund_id: unknown;
    refund_reason: unknown;
    refund_status: unknown;
    status: unknown;
    transaction_id: unknown;
    updated_at: unknown;
    user_id: unknown;
    user_service_id: unknown;
};

function createLegacyPool() {
    const primary = getPrimaryDatabaseConfig();
    const legacy = getLegacyDatabaseConfig();

    if (legacy === null) {
        throw new Error(
            'Legacy migration requires LEGACY_DB_HOST, LEGACY_DB_PORT, LEGACY_DB_USERNAME, LEGACY_DB_PASSWORD, and LEGACY_DB_DATABASE.',
        );
    }

    assertDifferentDatabases(primary, legacy);

    return {
        legacy,
        pool: mysql.createPool({
            connectionLimit: legacy.connectionLimit,
            database: legacy.database,
            dateStrings: true,
            decimalNumbers: false,
            host: legacy.host,
            namedPlaceholders: false,
            password: legacy.password,
            port: legacy.port,
            supportBigNumbers: true,
            user: legacy.username,
        }),
        primary,
    };
}

function createPrismaClient() {
    return new PrismaClient(createPrismaClientOptions());
}

async function queryRows<T extends LegacyRow>(
    pool: mysql.Pool,
    sql: string,
) {
    const [rows] = await pool.query(sql);
    return rows as T[];
}

function escapeMysqlIdentifier(identifier: string) {
    if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
        throw new Error(`Unsafe MySQL identifier: ${identifier}`);
    }

    return `\`${identifier}\``;
}

async function queryCount(pool: mysql.Pool, sql: string) {
    const rows = await queryRows<{ count: unknown }>(pool, sql);
    return toInteger(rows[0]?.count, 'count');
}

async function listLegacyTables(pool: mysql.Pool) {
    return queryRows<{ table_name: unknown }>(
        pool,
        `SELECT table_name AS table_name
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
         ORDER BY table_name`,
    );
}

async function hasLegacyColumn(
    pool: mysql.Pool,
    table: string,
    column: string,
) {
    const rows = await queryRows<{ column_name: unknown }>(
        pool,
        `SELECT column_name AS column_name
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = '${table}'
           AND column_name = '${column}'`,
    );

    return rows.length > 0;
}

async function summarizeSkippedLegacyTables(pool: mysql.Pool) {
    const legacyTableRows = await listLegacyTables(pool);
    const migratedTables = new Set<string>(REQUIRED_TABLES);
    const skippedTables = legacyTableRows
        .map((row) =>
            toRequiredString(row.table_name, 'information_schema.table_name'),
        )
        .filter((table) => !migratedTables.has(table));
    const summary: SkippedLegacyTableSummary[] = [];

    for (const table of skippedTables) {
        const sourceCount = await queryCount(
            pool,
            `SELECT COUNT(*) AS count FROM ${escapeMysqlIdentifier(table)}`,
        );

        summary.push({
            reason:
                SKIPPED_LEGACY_TABLE_REASONS[table] ??
                'Legacy table is not modeled in the fresh Prisma schema.',
            sourceCount,
            table,
        });
    }

    return summary;
}

function printSkippedLegacyTables(
    scope: 'migrate:legacy' | 'migrate:verify',
    skippedTables: SkippedLegacyTableSummary[],
) {
    if (skippedTables.length === 0) {
        return;
    }

    console.log(
        `[${scope}] The following legacy source tables were intentionally not migrated into the Prisma database:`,
    );
    console.table(skippedTables);
}

async function assertLegacyTablesExist(pool: mysql.Pool) {
    for (const table of REQUIRED_TABLES) {
        const rows = await queryRows<{ table_name: string }>(
            pool,
            `SELECT TABLE_NAME AS table_name
             FROM information_schema.tables
             WHERE table_schema = DATABASE()
               AND table_name = '${table}'`,
        );

        if (rows.length === 0) {
            throw new Error(
                `Legacy database is missing required table: ${table}`,
            );
        }
    }
}

async function assertTargetSchemaReady(prisma: PrismaClient) {
    try {
        await prisma.user.count();
    } catch (error) {
        throw new Error(
            `Target Prisma schema is not ready. Point DB_* at the fresh NestJS database, then run Prisma migrations first. Original error: ${
                (error as Error).message
            }`,
        );
    }
}

function toInteger(value: unknown, fieldName: string) {
    const parsed =
        typeof value === 'number'
            ? value
            : typeof value === 'bigint'
              ? Number(value)
              : Number(String(value ?? ''));

    if (!Number.isInteger(parsed)) {
        throw new Error(`Expected integer for ${fieldName}, got: ${value}`);
    }

    return parsed;
}

function toOptionalInteger(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return toInteger(value, 'optional integer');
}

function toBigIntValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return BigInt(String(value));
}

function toBoolean(value: unknown) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['1', 'true', 'yes'].includes(normalized)) {
            return true;
        }

        if (['0', 'false', 'no', ''].includes(normalized)) {
            return false;
        }
    }

    return Boolean(value);
}

function toRequiredString(value: unknown, fieldName: string) {
    if (value === null || value === undefined) {
        throw new Error(`Missing required value for ${fieldName}`);
    }

    return String(value);
}

function toOptionalString(value: unknown) {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
}

function toDateValue(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }

    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${value}`);
    }

    return date;
}

function toDecimalString(value: unknown) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return String(value);
}

function parseJsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (
        typeof value === 'boolean' ||
        typeof value === 'number' ||
        typeof value === 'string'
    ) {
        if (typeof value !== 'string') {
            return value;
        }

        try {
            return JSON.parse(value) as Prisma.InputJsonValue;
        } catch {
            return value;
        }
    }

    if (Array.isArray(value)) {
        return value as Prisma.InputJsonValue;
    }

    return value as Prisma.InputJsonValue;
}

function toNullableJsonInput(value: unknown) {
    const parsed = parseJsonValue(value);

    if (parsed === null) {
        return Prisma.DbNull;
    }

    return parsed;
}

function resolveFileExtension(row: LegacyServiceRequestDocumentRow) {
    const explicit = toOptionalString(row.file_extension);
    if (explicit) {
        return explicit.replace(/^\./, '');
    }

    const fromName =
        toOptionalString(row.file_name) ?? toOptionalString(row.file_path);
    if (!fromName || !fromName.includes('.')) {
        return null;
    }

    return fromName.split('.').pop() ?? null;
}

function buildPaymentNotes(row: LegacyPaymentRow) {
    const parsedNotes = parseJsonValue(row.notes);
    const notesObject: Record<string, Prisma.InputJsonValue> =
        parsedNotes &&
        typeof parsedNotes === 'object' &&
        !Array.isArray(parsedNotes)
            ? { ...(parsedNotes as Record<string, Prisma.InputJsonValue>) }
            : parsedNotes !== null
              ? { legacy_notes: parsedNotes }
              : {};

    const legacyPaymentDetails: Record<string, Prisma.InputJsonValue> = {};
    const maybeSet = (key: string, value: unknown) => {
        const normalized = parseJsonValue(value);
        if (normalized !== null) {
            legacyPaymentDetails[key] = normalized;
        }
    };

    maybeSet('base_amount', toDecimalString(row.base_amount));
    maybeSet('gst_amount', toDecimalString(row.gst_amount));
    maybeSet('payment_reference', row.payment_reference);
    maybeSet('transaction_id', row.transaction_id);
    maybeSet('payment_gateway_response', row.payment_gateway_response);
    maybeSet('payment_gateway_error', row.payment_gateway_error);
    maybeSet('metadata', parseJsonValue(row.metadata));
    maybeSet('payment_date', toOptionalString(row.payment_date));
    maybeSet('payment_verified_at', toOptionalString(row.payment_verified_at));

    if (Object.keys(legacyPaymentDetails).length > 0) {
        notesObject._legacy_payment = legacyPaymentDetails;
    }

    return Object.keys(notesObject).length === 0
        ? Prisma.DbNull
        : (notesObject as Prisma.InputJsonValue);
}

async function getTargetCount(
    prisma: PrismaClient,
    table: TableName,
) {
    switch (table) {
        case 'service_categories':
            return prisma.serviceCategory.count();
        case 'services':
            return prisma.service.count();
        case 'service_documents':
            return prisma.serviceDocument.count();
        case 'users':
            return prisma.user.count();
        case 'enquiries':
            return prisma.enquiry.count();
        case 'user_services':
            return prisma.userService.count();
        case 'service_request_documents':
            return prisma.serviceRequestDocument.count();
        case 'payments':
            return prisma.payment.count();
    }
}

async function verifyStageCount(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    table: TableName,
    migratedRows: number,
) {
    const sourceCount = await queryCount(pool, SOURCE_COUNT_QUERIES[table]);
    const targetCount = await getTargetCount(prisma, table);
    const stageSummary = {
        migratedRows,
        sourceCount,
        table,
        targetCount,
    };

    summary.push(stageSummary);
    console.log(
        `[migrate:legacy] ${table}: migrated ${migratedRows}, source=${sourceCount}, target=${targetCount}`,
    );

    if (sourceCount !== targetCount) {
        throw new Error(
            `Count mismatch for ${table}. Source has ${sourceCount} row(s) but target has ${targetCount}.`,
        );
    }
}

function ensureReferenceExists(
    id: number | null,
    knownIds: ReadonlySet<number>,
    label: string,
) {
    if (id === null) {
        return;
    }

    if (!knownIds.has(id)) {
        throw new Error(`Missing referenced ${label} with id=${id}`);
    }
}

async function migrateServiceCategories(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
) {
    const rows = await queryRows<LegacyServiceCategoryRow>(
        pool,
        `SELECT id, name, slug, description, icon, is_active, sort_order
         FROM service_categories
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(row.id, 'service_categories.id');

        await prisma.serviceCategory.upsert({
            where: { id },
            create: {
                description: toOptionalString(row.description),
                icon: toOptionalString(row.icon),
                id,
                isActive: toBoolean(row.is_active),
                name: toRequiredString(row.name, 'service_categories.name'),
                slug: toRequiredString(row.slug, 'service_categories.slug'),
                sortOrder: toInteger(row.sort_order ?? 0, 'service_categories.sort_order'),
            },
            update: {
                description: toOptionalString(row.description),
                icon: toOptionalString(row.icon),
                isActive: toBoolean(row.is_active),
                name: toRequiredString(row.name, 'service_categories.name'),
                slug: toRequiredString(row.slug, 'service_categories.slug'),
                sortOrder: toInteger(row.sort_order ?? 0, 'service_categories.sort_order'),
            },
        });
    }

    await verifyStageCount(
        pool,
        prisma,
        summary,
        'service_categories',
        rows.length,
    );

    return new Set(rows.map((row) => toInteger(row.id, 'service_categories.id')));
}

async function migrateServices(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    categoryIds: ReadonlySet<number>,
) {
    const rows = await queryRows<LegacyServiceRow>(
        pool,
        `SELECT
            id,
            service_category_id,
            name,
            short_description,
            slug,
            link,
            description,
            long_description,
            features,
            requirements,
            process,
            price,
            pricing_plans,
            gst_percentage,
            service_code,
            service_type,
            processing_days,
            is_active,
            is_popular,
            is_featured,
            metadata,
            faqs,
            required_documents_list,
            extra_documents,
            admin_notes
         FROM services
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(row.id, 'services.id');
        const serviceCategoryId = toInteger(
            row.service_category_id,
            'services.service_category_id',
        );

        ensureReferenceExists(
            serviceCategoryId,
            categoryIds,
            'service category',
        );

        await prisma.service.upsert({
            where: { id },
            create: {
                adminNotes: toOptionalString(row.admin_notes),
                description: toOptionalString(row.description),
                extraDocuments: toNullableJsonInput(row.extra_documents),
                faqs: toNullableJsonInput(row.faqs),
                features: toOptionalString(row.features),
                gstPercentage:
                    toDecimalString(row.gst_percentage) ?? '18.00',
                id,
                isActive: toBoolean(row.is_active),
                isFeatured: toBoolean(row.is_featured),
                isPopular: toBoolean(row.is_popular),
                link: toOptionalString(row.link),
                longDescription: toOptionalString(row.long_description),
                metadata: toNullableJsonInput(row.metadata),
                name: toRequiredString(row.name, 'services.name'),
                price: toDecimalString(row.price),
                pricingPlans: toNullableJsonInput(row.pricing_plans),
                process: toOptionalString(row.process),
                processingDays: toInteger(
                    row.processing_days ?? 7,
                    'services.processing_days',
                ),
                requiredDocumentsList: toNullableJsonInput(
                    row.required_documents_list,
                ),
                requirements: toOptionalString(row.requirements),
                serviceCategoryId,
                serviceCode: toOptionalString(row.service_code),
                serviceType:
                    toOptionalString(row.service_type) ?? 'standard',
                shortDescription: toOptionalString(row.short_description),
                slug: toRequiredString(row.slug, 'services.slug'),
            },
            update: {
                adminNotes: toOptionalString(row.admin_notes),
                description: toOptionalString(row.description),
                extraDocuments: toNullableJsonInput(row.extra_documents),
                faqs: toNullableJsonInput(row.faqs),
                features: toOptionalString(row.features),
                gstPercentage:
                    toDecimalString(row.gst_percentage) ?? '18.00',
                isActive: toBoolean(row.is_active),
                isFeatured: toBoolean(row.is_featured),
                isPopular: toBoolean(row.is_popular),
                link: toOptionalString(row.link),
                longDescription: toOptionalString(row.long_description),
                metadata: toNullableJsonInput(row.metadata),
                name: toRequiredString(row.name, 'services.name'),
                price: toDecimalString(row.price),
                pricingPlans: toNullableJsonInput(row.pricing_plans),
                process: toOptionalString(row.process),
                processingDays: toInteger(
                    row.processing_days ?? 7,
                    'services.processing_days',
                ),
                requiredDocumentsList: toNullableJsonInput(
                    row.required_documents_list,
                ),
                requirements: toOptionalString(row.requirements),
                serviceCategoryId,
                serviceCode: toOptionalString(row.service_code),
                serviceType:
                    toOptionalString(row.service_type) ?? 'standard',
                shortDescription: toOptionalString(row.short_description),
                slug: toRequiredString(row.slug, 'services.slug'),
            },
        });
    }

    await verifyStageCount(pool, prisma, summary, 'services', rows.length);

    return new Set(rows.map((row) => toInteger(row.id, 'services.id')));
}

async function migrateServiceDocuments(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    serviceIds: ReadonlySet<number>,
) {
    const rows = await queryRows<LegacyServiceDocumentRow>(
        pool,
        `SELECT
            id,
            service_id,
            document_name,
            name,
            slug,
            description,
            document_type,
            file_type,
            max_size,
            is_required,
            sort_order,
            metadata
         FROM service_documents
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(row.id, 'service_documents.id');
        const serviceId = toInteger(
            row.service_id,
            'service_documents.service_id',
        );

        ensureReferenceExists(serviceId, serviceIds, 'service');

        await prisma.serviceDocument.upsert({
            where: { id },
            create: {
                description: toOptionalString(row.description),
                documentName: toOptionalString(row.document_name),
                documentType:
                    toOptionalString(row.document_type) ?? 'required',
                fileType: toOptionalString(row.file_type) ?? 'pdf',
                id,
                isRequired: toBoolean(row.is_required),
                maxSize: toInteger(
                    row.max_size ?? 5,
                    'service_documents.max_size',
                ),
                metadata: toNullableJsonInput(row.metadata),
                name: toOptionalString(row.name),
                serviceId,
                slug: toOptionalString(row.slug),
                sortOrder: toInteger(
                    row.sort_order ?? 0,
                    'service_documents.sort_order',
                ),
            },
            update: {
                description: toOptionalString(row.description),
                documentName: toOptionalString(row.document_name),
                documentType:
                    toOptionalString(row.document_type) ?? 'required',
                fileType: toOptionalString(row.file_type) ?? 'pdf',
                isRequired: toBoolean(row.is_required),
                maxSize: toInteger(
                    row.max_size ?? 5,
                    'service_documents.max_size',
                ),
                metadata: toNullableJsonInput(row.metadata),
                name: toOptionalString(row.name),
                serviceId,
                slug: toOptionalString(row.slug),
                sortOrder: toInteger(
                    row.sort_order ?? 0,
                    'service_documents.sort_order',
                ),
            },
        });
    }

    await verifyStageCount(
        pool,
        prisma,
        summary,
        'service_documents',
        rows.length,
    );

    return new Set(rows.map((row) => toInteger(row.id, 'service_documents.id')));
}

async function migrateUsers(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
) {
    const rows = await queryRows<LegacyUserRow>(
        pool,
        `SELECT
            id,
            name,
            email,
            password,
            role,
            mobile,
            mobile_number,
            is_mobile_verified,
            referral_code,
            rm_unique_id,
            unique_id,
            accountant_unique_id,
            rm_id,
            accountant_id,
            address,
            city,
            state,
            pincode,
            created_at,
            updated_at
         FROM users
         ORDER BY id`,
    );

    const userIds = new Set<number>();

    for (const row of rows) {
        const id = toInteger(row.id, 'users.id');
        userIds.add(id);

        await prisma.user.upsert({
            where: { id },
            create: {
                accountantId: null,
                accountantUniqueId: toOptionalString(
                    row.accountant_unique_id,
                ),
                address: toOptionalString(row.address),
                city: toOptionalString(row.city),
                createdAt: toDateValue(row.created_at),
                email: toRequiredString(row.email, 'users.email'),
                id,
                isMobileVerified: toBoolean(row.is_mobile_verified),
                mobileNumber:
                    toOptionalString(row.mobile_number) ??
                    toOptionalString(row.mobile),
                name: toRequiredString(row.name, 'users.name'),
                password: toRequiredString(row.password, 'users.password'),
                pincode: toOptionalString(row.pincode),
                referralCode: toOptionalString(row.referral_code),
                rmId: null,
                rmUniqueId:
                    toOptionalString(row.rm_unique_id) ??
                    toOptionalString(row.unique_id),
                role: toOptionalString(row.role) ?? 'user',
                state: toOptionalString(row.state),
                updatedAt: toDateValue(row.updated_at),
            },
            update: {
                accountantId: null,
                accountantUniqueId: toOptionalString(
                    row.accountant_unique_id,
                ),
                address: toOptionalString(row.address),
                city: toOptionalString(row.city),
                createdAt: toDateValue(row.created_at),
                email: toRequiredString(row.email, 'users.email'),
                isMobileVerified: toBoolean(row.is_mobile_verified),
                mobileNumber:
                    toOptionalString(row.mobile_number) ??
                    toOptionalString(row.mobile),
                name: toRequiredString(row.name, 'users.name'),
                password: toRequiredString(row.password, 'users.password'),
                pincode: toOptionalString(row.pincode),
                referralCode: toOptionalString(row.referral_code),
                rmId: null,
                rmUniqueId:
                    toOptionalString(row.rm_unique_id) ??
                    toOptionalString(row.unique_id),
                role: toOptionalString(row.role) ?? 'user',
                state: toOptionalString(row.state),
                updatedAt: toDateValue(row.updated_at),
            },
        });
    }

    for (const row of rows) {
        const id = toInteger(row.id, 'users.id');
        const rmId = toOptionalInteger(row.rm_id);
        const accountantId = toOptionalInteger(row.accountant_id);

        ensureReferenceExists(rmId, userIds, 'relationship manager user');
        ensureReferenceExists(accountantId, userIds, 'accountant user');

        await prisma.user.update({
            where: { id },
            data: {
                accountantId,
                rmId,
            },
        });
    }

    await verifyStageCount(pool, prisma, summary, 'users', rows.length);

    return userIds;
}

async function migrateEnquiries(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
) {
    const rows = await queryRows<LegacyEnquiryRow>(
        pool,
        `SELECT
            id,
            name,
            email,
            phone,
            mobile,
            service,
            service_type,
            message,
            status,
            created_at,
            updated_at
         FROM enquiries
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(row.id, 'enquiries.id');

        await prisma.enquiry.upsert({
            where: { id },
            create: {
                createdAt: toDateValue(row.created_at),
                email: toRequiredString(row.email, 'enquiries.email'),
                id,
                message: toRequiredString(row.message, 'enquiries.message'),
                name: toRequiredString(row.name, 'enquiries.name'),
                phone:
                    toOptionalString(row.phone) ?? toOptionalString(row.mobile),
                service:
                    toOptionalString(row.service) ??
                    toOptionalString(row.service_type),
                status: toOptionalString(row.status) ?? 'pending',
                updatedAt: toDateValue(row.updated_at),
            },
            update: {
                createdAt: toDateValue(row.created_at),
                email: toRequiredString(row.email, 'enquiries.email'),
                message: toRequiredString(row.message, 'enquiries.message'),
                name: toRequiredString(row.name, 'enquiries.name'),
                phone:
                    toOptionalString(row.phone) ?? toOptionalString(row.mobile),
                service:
                    toOptionalString(row.service) ??
                    toOptionalString(row.service_type),
                status: toOptionalString(row.status) ?? 'pending',
                updatedAt: toDateValue(row.updated_at),
            },
        });
    }

    await verifyStageCount(pool, prisma, summary, 'enquiries', rows.length);
}

async function migrateUserServices(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    userIds: ReadonlySet<number>,
    serviceIds: ReadonlySet<number>,
) {
    const rows = await queryRows<LegacyUserServiceRow>(
        pool,
        `SELECT
            id,
            user_id,
            service_id,
            accountant_id,
            assigned_accountant_id,
            application_unique_id,
            status,
            payment_status,
            form_data,
            documents,
            amount,
            notes,
            revision_notes,
            ca_notes,
            update_note,
            rejection_reason,
            verified,
            certificate_url,
            submitted_to_ca_at,
            created_at,
            updated_at
         FROM user_services
         ORDER BY id`,
    );

    const userServiceIds = new Set<number>();
    const ownerByUserServiceId = new Map<number, number>();

    for (const row of rows) {
        const id = toInteger(row.id, 'user_services.id');
        const userId = toInteger(row.user_id, 'user_services.user_id');
        const serviceId = toInteger(row.service_id, 'user_services.service_id');
        const accountantId =
            toOptionalInteger(row.accountant_id) ??
            toOptionalInteger(row.assigned_accountant_id);

        ensureReferenceExists(userId, userIds, 'user');
        ensureReferenceExists(serviceId, serviceIds, 'service');
        ensureReferenceExists(accountantId, userIds, 'accountant');

        userServiceIds.add(id);
        ownerByUserServiceId.set(id, userId);

        await prisma.userService.upsert({
            where: { id },
            create: {
                accountantId,
                amount: toDecimalString(row.amount),
                applicationUniqueId: toOptionalString(
                    row.application_unique_id,
                ),
                caNotes: toOptionalString(row.ca_notes),
                certificateUrl: toOptionalString(row.certificate_url),
                createdAt: toDateValue(row.created_at),
                documents: toNullableJsonInput(row.documents),
                formData: toNullableJsonInput(row.form_data),
                id,
                notes: toOptionalString(row.notes),
                paymentStatus: normalizeLegacyUserServicePaymentStatus(
                    toOptionalString(row.payment_status),
                ),
                rejectionReason: toOptionalString(row.rejection_reason),
                revisionNotes: toOptionalString(row.revision_notes),
                serviceId,
                status: toOptionalString(row.status) ?? 'draft',
                submittedToCaAt: toDateValue(row.submitted_to_ca_at),
                updateNote: toOptionalString(row.update_note),
                updatedAt: toDateValue(row.updated_at),
                userId,
                verified: toBoolean(row.verified),
            },
            update: {
                accountantId,
                amount: toDecimalString(row.amount),
                applicationUniqueId: toOptionalString(
                    row.application_unique_id,
                ),
                caNotes: toOptionalString(row.ca_notes),
                certificateUrl: toOptionalString(row.certificate_url),
                createdAt: toDateValue(row.created_at),
                documents: toNullableJsonInput(row.documents),
                formData: toNullableJsonInput(row.form_data),
                notes: toOptionalString(row.notes),
                paymentStatus: normalizeLegacyUserServicePaymentStatus(
                    toOptionalString(row.payment_status),
                ),
                rejectionReason: toOptionalString(row.rejection_reason),
                revisionNotes: toOptionalString(row.revision_notes),
                serviceId,
                status: toOptionalString(row.status) ?? 'draft',
                submittedToCaAt: toDateValue(row.submitted_to_ca_at),
                updateNote: toOptionalString(row.update_note),
                updatedAt: toDateValue(row.updated_at),
                userId,
                verified: toBoolean(row.verified),
            },
        });
    }

    await verifyStageCount(pool, prisma, summary, 'user_services', rows.length);

    return {
        ownerByUserServiceId,
        userServiceIds,
    };
}

async function migrateServiceRequestDocuments(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    userIds: ReadonlySet<number>,
    userServiceIds: ReadonlySet<number>,
    ownerByUserServiceId: ReadonlyMap<number, number>,
    serviceDocumentIds: ReadonlySet<number>,
) {
    const hasSourceDocumentId = await hasLegacyColumn(
        pool,
        'service_request_documents',
        'source_document_id',
    );
    const rows = await queryRows<LegacyServiceRequestDocumentRow>(
        pool,
        `SELECT
            id,
            user_service_id,
            service_document_id,
            uploaded_by,
            ${hasSourceDocumentId ? 'source_document_id' : 'NULL AS source_document_id'},
            document_name,
            document_type,
            document_category,
            file_name,
            file_path,
            file_extension,
            file_size,
            mime_type,
            version,
            status,
            notes,
            is_final,
            created_at,
            updated_at
         FROM service_request_documents
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(
            row.id,
            'service_request_documents.id',
        );
        const userServiceId = toInteger(
            row.user_service_id,
            'service_request_documents.user_service_id',
        );
        const serviceDocumentId = toOptionalInteger(row.service_document_id);
        const uploadedById =
            toOptionalInteger(row.uploaded_by) ??
            ownerByUserServiceId.get(userServiceId) ??
            null;

        ensureReferenceExists(
            userServiceId,
            userServiceIds,
            'user service',
        );
        ensureReferenceExists(
            serviceDocumentId,
            serviceDocumentIds,
            'service document',
        );
        ensureReferenceExists(uploadedById, userIds, 'uploaded_by user');

        if (uploadedById === null) {
            throw new Error(
                `Unable to resolve uploaded_by for service_request_documents.id=${id}`,
            );
        }

        await prisma.serviceRequestDocument.upsert({
            where: { id },
            create: {
                createdAt: toDateValue(row.created_at),
                documentCategory: toOptionalString(row.document_category),
                documentName: toOptionalString(row.document_name),
                documentType: toOptionalString(row.document_type) ?? 'client',
                fileExtension: resolveFileExtension(row),
                fileName: toRequiredString(
                    row.file_name,
                    'service_request_documents.file_name',
                ),
                filePath: toRequiredString(
                    row.file_path,
                    'service_request_documents.file_path',
                ),
                fileSize: toBigIntValue(row.file_size),
                id,
                isFinal: toBoolean(row.is_final),
                mimeType:
                    toOptionalString(row.mime_type) ??
                    'application/octet-stream',
                notes: toOptionalString(row.notes),
                serviceDocumentId,
                sourceDocumentId: toOptionalInteger(row.source_document_id),
                status: toOptionalString(row.status) ?? 'pending',
                updatedAt: toDateValue(row.updated_at),
                uploadedById,
                userServiceId,
                version: toInteger(
                    row.version ?? 1,
                    'service_request_documents.version',
                ),
            },
            update: {
                createdAt: toDateValue(row.created_at),
                documentCategory: toOptionalString(row.document_category),
                documentName: toOptionalString(row.document_name),
                documentType: toOptionalString(row.document_type) ?? 'client',
                fileExtension: resolveFileExtension(row),
                fileName: toRequiredString(
                    row.file_name,
                    'service_request_documents.file_name',
                ),
                filePath: toRequiredString(
                    row.file_path,
                    'service_request_documents.file_path',
                ),
                fileSize: toBigIntValue(row.file_size),
                isFinal: toBoolean(row.is_final),
                mimeType:
                    toOptionalString(row.mime_type) ??
                    'application/octet-stream',
                notes: toOptionalString(row.notes),
                serviceDocumentId,
                sourceDocumentId: toOptionalInteger(row.source_document_id),
                status: toOptionalString(row.status) ?? 'pending',
                updatedAt: toDateValue(row.updated_at),
                uploadedById,
                userServiceId,
                version: toInteger(
                    row.version ?? 1,
                    'service_request_documents.version',
                ),
            },
        });
    }

    await verifyStageCount(
        pool,
        prisma,
        summary,
        'service_request_documents',
        rows.length,
    );
}

async function migratePayments(
    pool: mysql.Pool,
    prisma: PrismaClient,
    summary: StageSummary[],
    userIds: ReadonlySet<number>,
    userServiceIds: ReadonlySet<number>,
) {
    const rows = await queryRows<LegacyPaymentRow>(
        pool,
        `SELECT
            id,
            user_id,
            user_service_id,
            payment_provider,
            payment_provider_order_id,
            payment_provider_transaction_id,
            payment_provider_status,
            payment_status,
            status,
            payment_method,
            amount,
            currency,
            order_unique_id,
            invoice_unique_id,
            notes,
            metadata,
            refund_id,
            refund_amount,
            refund_reason,
            refund_status,
            base_amount,
            gst_amount,
            payment_reference,
            transaction_id,
            payment_gateway_response,
            payment_gateway_error,
            payment_date,
            payment_verified_at,
            created_at,
            updated_at
         FROM payments
         ORDER BY id`,
    );

    for (const row of rows) {
        const id = toInteger(row.id, 'payments.id');
        const userId = toInteger(row.user_id, 'payments.user_id');
        const userServiceId = toOptionalInteger(row.user_service_id);

        ensureReferenceExists(userId, userIds, 'payment user');
        ensureReferenceExists(userServiceId, userServiceIds, 'payment user service');

        await prisma.payment.upsert({
            where: { id },
            create: {
                amount:
                    toDecimalString(row.amount) ??
                    (() => {
                        throw new Error(
                            `Missing payments.amount for payment id=${id}`,
                        );
                    })(),
                createdAt: toDateValue(row.created_at),
                currency: toOptionalString(row.currency) ?? 'INR',
                id,
                invoiceUniqueId: toOptionalString(row.invoice_unique_id),
                notes: buildPaymentNotes(row),
                orderUniqueId: toOptionalString(row.order_unique_id),
                paymentMethod: toOptionalString(row.payment_method),
                paymentProvider:
                    toOptionalString(row.payment_provider) ?? 'razorpay',
                paymentProviderOrderId: toOptionalString(
                    row.payment_provider_order_id,
                ),
                paymentProviderStatus: toOptionalString(
                    row.payment_provider_status,
                ),
                paymentProviderTransactionId:
                    toOptionalString(row.payment_provider_transaction_id) ??
                    toOptionalString(row.transaction_id),
                paymentStatus:
                    toOptionalString(row.payment_status) ??
                    toOptionalString(row.status) ??
                    'pending',
                refundAmount: toDecimalString(row.refund_amount),
                refundId: toOptionalString(row.refund_id),
                refundReason: toOptionalString(row.refund_reason),
                refundStatus: toOptionalString(row.refund_status),
                status:
                    toOptionalString(row.status) ??
                    toOptionalString(row.payment_status) ??
                    'pending',
                updatedAt: toDateValue(row.updated_at),
                userId,
                userServiceId,
            },
            update: {
                amount:
                    toDecimalString(row.amount) ??
                    (() => {
                        throw new Error(
                            `Missing payments.amount for payment id=${id}`,
                        );
                    })(),
                createdAt: toDateValue(row.created_at),
                currency: toOptionalString(row.currency) ?? 'INR',
                invoiceUniqueId: toOptionalString(row.invoice_unique_id),
                notes: buildPaymentNotes(row),
                orderUniqueId: toOptionalString(row.order_unique_id),
                paymentMethod: toOptionalString(row.payment_method),
                paymentProvider:
                    toOptionalString(row.payment_provider) ?? 'razorpay',
                paymentProviderOrderId: toOptionalString(
                    row.payment_provider_order_id,
                ),
                paymentProviderStatus: toOptionalString(
                    row.payment_provider_status,
                ),
                paymentProviderTransactionId:
                    toOptionalString(row.payment_provider_transaction_id) ??
                    toOptionalString(row.transaction_id),
                paymentStatus:
                    toOptionalString(row.payment_status) ??
                    toOptionalString(row.status) ??
                    'pending',
                refundAmount: toDecimalString(row.refund_amount),
                refundId: toOptionalString(row.refund_id),
                refundReason: toOptionalString(row.refund_reason),
                refundStatus: toOptionalString(row.refund_status),
                status:
                    toOptionalString(row.status) ??
                    toOptionalString(row.payment_status) ??
                    'pending',
                updatedAt: toDateValue(row.updated_at),
                userId,
                userServiceId,
            },
        });
    }

    await verifyStageCount(pool, prisma, summary, 'payments', rows.length);
}

async function readStatusCountsFromLegacy(
    pool: mysql.Pool,
    table: 'payments' | 'user_services',
    column: 'payment_status' | 'status',
) {
    const rows = await queryRows<{ count: unknown; status: unknown }>(
        pool,
        `SELECT ${column} AS status, COUNT(*) AS count
         FROM ${table}
         GROUP BY ${column}
         ORDER BY ${column}`,
    );

    return new Map(
        rows.map((row) => [String(row.status ?? ''), toInteger(row.count, 'count')]),
    );
}

function compareCountMaps(
    label: string,
    source: ReadonlyMap<string, number>,
    target: ReadonlyMap<string, number>,
) {
    const keys = [...new Set([...source.keys(), ...target.keys()])].sort();

    for (const key of keys) {
        const sourceCount = source.get(key) ?? 0;
        const targetCount = target.get(key) ?? 0;

        if (sourceCount !== targetCount) {
            throw new Error(
                `${label} mismatch for '${key}'. Source has ${sourceCount}, target has ${targetCount}.`,
            );
        }
    }
}

async function verifyAllTableCounts(
    pool: mysql.Pool,
    prisma: PrismaClient,
) {
    const rows: StageSummary[] = [];

    for (const table of REQUIRED_TABLES) {
        rows.push({
            migratedRows: 0,
            sourceCount: await queryCount(pool, SOURCE_COUNT_QUERIES[table]),
            table,
            targetCount: await getTargetCount(prisma, table),
        });
    }

    console.table(rows);

    for (const row of rows) {
        if (row.sourceCount !== row.targetCount) {
            throw new Error(
                `Count mismatch for ${row.table}. Source has ${row.sourceCount} row(s) but target has ${row.targetCount}.`,
            );
        }
    }
}

async function verifyPaymentTotalsAndStatuses(
    pool: mysql.Pool,
    prisma: PrismaClient,
) {
    const sourcePaymentCount = await queryCount(
        pool,
        'SELECT COUNT(*) AS count FROM payments',
    );
    const sourcePaymentSumRows = await queryRows<{ total_amount: unknown }>(
        pool,
        'SELECT COALESCE(SUM(amount), 0) AS total_amount FROM payments',
    );
    const sourcePaymentSum = Number(
        sourcePaymentSumRows[0]?.total_amount ?? 0,
    ).toFixed(2);

    const targetPaymentAggregate = await prisma.payment.aggregate({
        _count: { _all: true },
        _sum: { amount: true },
    });
    const targetPaymentCount = targetPaymentAggregate._count._all;
    const targetPaymentSum = Number(
        targetPaymentAggregate._sum.amount ?? 0,
    ).toFixed(2);

    if (sourcePaymentCount !== targetPaymentCount) {
        throw new Error(
            `Payment count mismatch. Source has ${sourcePaymentCount}, target has ${targetPaymentCount}.`,
        );
    }

    if (sourcePaymentSum !== targetPaymentSum) {
        throw new Error(
            `Payment total mismatch. Source sum is ${sourcePaymentSum}, target sum is ${targetPaymentSum}.`,
        );
    }

    const sourceStatusCounts = await readStatusCountsFromLegacy(
        pool,
        'payments',
        'status',
    );
    const sourcePaymentStatusCounts = await readStatusCountsFromLegacy(
        pool,
        'payments',
        'payment_status',
    );

    const targetStatusRows = await prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
    });
    const targetPaymentStatusRows = await prisma.payment.groupBy({
        by: ['paymentStatus'],
        _count: { _all: true },
        orderBy: { paymentStatus: 'asc' },
    });

    const targetStatusCounts = new Map(
        targetStatusRows.map((row) => [
            String(row.status ?? ''),
            row._count._all,
        ]),
    );
    const targetPaymentStatusCounts = new Map(
        targetPaymentStatusRows.map((row) => [
            String(row.paymentStatus ?? ''),
            row._count._all,
        ]),
    );

    compareCountMaps('payments.status', sourceStatusCounts, targetStatusCounts);
    compareCountMaps(
        'payments.payment_status',
        sourcePaymentStatusCounts,
        targetPaymentStatusCounts,
    );

    console.table([
        {
            metric: 'payments.count',
            source: sourcePaymentCount,
            target: targetPaymentCount,
        },
        {
            metric: 'payments.amount_sum',
            source: sourcePaymentSum,
            target: targetPaymentSum,
        },
    ]);
}

async function verifyNoTargetOrphans(prisma: PrismaClient) {
    const paymentOrphans = await prisma.$queryRaw<
        Array<{ count: bigint | number }>
    >`SELECT COUNT(*) AS count
      FROM payments p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN user_services us ON us.id = p.user_service_id
      WHERE u.id IS NULL
         OR (p.user_service_id IS NOT NULL AND us.id IS NULL)`;

    const documentOrphans = await prisma.$queryRaw<
        Array<{ count: bigint | number }>
    >`SELECT COUNT(*) AS count
      FROM service_request_documents srd
      LEFT JOIN user_services us ON us.id = srd.user_service_id
      LEFT JOIN users u ON u.id = srd.uploaded_by
      LEFT JOIN service_documents sd ON sd.id = srd.service_document_id
      WHERE us.id IS NULL
         OR u.id IS NULL
         OR (srd.service_document_id IS NOT NULL AND sd.id IS NULL)`;

    const paymentOrphanCount = Number(paymentOrphans[0]?.count ?? 0);
    const documentOrphanCount = Number(documentOrphans[0]?.count ?? 0);

    if (paymentOrphanCount !== 0) {
        throw new Error(
            `Target payments contain ${paymentOrphanCount} orphaned row(s).`,
        );
    }

    if (documentOrphanCount !== 0) {
        throw new Error(
            `Target service_request_documents contain ${documentOrphanCount} orphaned row(s).`,
        );
    }
}

export async function runLegacyMigration() {
    const { legacy, pool, primary } = createLegacyPool();
    const prisma = createPrismaClient();
    const summary: StageSummary[] = [];
    const skippedTables = await summarizeSkippedLegacyTables(pool);

    console.log(
        `[migrate:legacy] source=${describeDatabaseConnection(legacy)} target=${describeDatabaseConnection(primary)}`,
    );

    try {
        await prisma.$connect();
        await assertLegacyTablesExist(pool);
        await assertTargetSchemaReady(prisma);

        const categoryIds = await migrateServiceCategories(pool, prisma, summary);
        const serviceIds = await migrateServices(
            pool,
            prisma,
            summary,
            categoryIds,
        );
        const serviceDocumentIds = await migrateServiceDocuments(
            pool,
            prisma,
            summary,
            serviceIds,
        );
        const userIds = await migrateUsers(pool, prisma, summary);

        await migrateEnquiries(pool, prisma, summary);

        const { ownerByUserServiceId, userServiceIds } =
            await migrateUserServices(
                pool,
                prisma,
                summary,
                userIds,
                serviceIds,
            );

        await migrateServiceRequestDocuments(
            pool,
            prisma,
            summary,
            userIds,
            userServiceIds,
            ownerByUserServiceId,
            serviceDocumentIds,
        );

        await migratePayments(
            pool,
            prisma,
            summary,
            userIds,
            userServiceIds,
        );

        console.table(summary);
        printSkippedLegacyTables('migrate:legacy', skippedTables);
        console.log('[migrate:legacy] Legacy import completed successfully.');
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

export async function verifyLegacyMigration() {
    const { legacy, pool, primary } = createLegacyPool();
    const prisma = createPrismaClient();
    const skippedTables = await summarizeSkippedLegacyTables(pool);

    console.log(
        `[migrate:verify] source=${describeDatabaseConnection(legacy)} target=${describeDatabaseConnection(primary)}`,
    );

    try {
        await prisma.$connect();
        await assertLegacyTablesExist(pool);
        await assertTargetSchemaReady(prisma);

        await verifyAllTableCounts(pool, prisma);
        await verifyPaymentTotalsAndStatuses(pool, prisma);
        await verifyNoTargetOrphans(prisma);

        printSkippedLegacyTables('migrate:verify', skippedTables);
        console.log(
            '[migrate:verify] Count, payment, and referential checks passed.',
        );
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
