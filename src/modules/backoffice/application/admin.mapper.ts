import { toServiceResource } from '../../catalog/application/catalog.mapper';

type LoosePayload = Record<string, unknown>;

export type NormalizedAdminCategoryInput = any;

export type NormalizedAdminServiceInput = any;

function asRecord(input: unknown): LoosePayload {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return {};
    }

    return input as LoosePayload;
}

function pickValue(payload: LoosePayload, ...keys: string[]) {
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
            return payload[key];
        }
    }

    return undefined;
}

function toNullableString(value: unknown) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
}

function toBoolean(value: unknown) {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['1', 'true', 'yes', 'on'].includes(normalized)) {
            return true;
        }

        if (['0', 'false', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }

    return Boolean(value);
}

function toNumber(value: unknown) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : undefined;
}

function toJsonLike(value: unknown) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    if (typeof value !== 'string') {
        return value;
    }

    const normalized = value.trim();

    if (normalized === '') {
        return null;
    }

    try {
        return JSON.parse(normalized);
    } catch {
        return value;
    }
}

export function normalizeAdminCategoryInput(
    input: unknown,
): NormalizedAdminCategoryInput {
    const payload = asRecord(input);
    const normalized: any = {};

    const name = toNullableString(pickValue(payload, 'name', 'category'));
    if (name !== undefined && name !== null) {
        normalized.name = name;
    }

    const icon = toNullableString(pickValue(payload, 'icon'));
    if (icon !== undefined) {
        normalized.icon = icon;
    }

    const description = toNullableString(pickValue(payload, 'description'));
    if (description !== undefined) {
        normalized.description = description;
    }

    const isActive = toBoolean(pickValue(payload, 'isActive', 'is_active'));
    if (isActive !== undefined) {
        normalized.isActive = isActive;
    }

    const sortOrder = toNumber(pickValue(payload, 'sortOrder', 'sort_order'));
    if (sortOrder !== undefined) {
        normalized.sortOrder = sortOrder;
    }

    return normalized;
}

export function normalizeAdminServiceInput(
    input: unknown,
): NormalizedAdminServiceInput {
    const payload = asRecord(input);
    const normalized: any = {};

    const serviceCategoryId = toNumber(
        pickValue(payload, 'serviceCategoryId', 'service_category_id'),
    );
    if (serviceCategoryId !== undefined) {
        normalized.serviceCategoryId = serviceCategoryId;
    }

    const name = toNullableString(pickValue(payload, 'name'));
    if (name !== undefined && name !== null) {
        normalized.name = name;
    }

    const shortDescription = toNullableString(
        pickValue(payload, 'shortDescription', 'short_description'),
    );
    if (shortDescription !== undefined) {
        normalized.shortDescription = shortDescription;
    }

    const link = toNullableString(pickValue(payload, 'link'));
    if (link !== undefined) {
        normalized.link = link;
    }

    const description = toNullableString(pickValue(payload, 'description'));
    if (description !== undefined) {
        normalized.description = description;
    }

    const longDescription = toNullableString(
        pickValue(payload, 'longDescription', 'long_description'),
    );
    if (longDescription !== undefined) {
        normalized.longDescription = longDescription;
    }

    const features = toNullableString(pickValue(payload, 'features'));
    if (features !== undefined) {
        normalized.features = features;
    }

    const requirements = toNullableString(pickValue(payload, 'requirements'));
    if (requirements !== undefined) {
        normalized.requirements = requirements;
    }

    const process = toNullableString(pickValue(payload, 'process'));
    if (process !== undefined) {
        normalized.process = process;
    }

    const price = toNullableString(pickValue(payload, 'price'));
    if (price !== undefined) {
        normalized.price = price;
    }

    const pricingPlans = toJsonLike(
        pickValue(payload, 'pricingPlans', 'pricing_plans'),
    );
    if (pricingPlans !== undefined) {
        normalized.pricingPlans = pricingPlans;
    }

    const gstPercentage = toNullableString(
        pickValue(payload, 'gstPercentage', 'gst_percentage'),
    );
    if (gstPercentage !== undefined && gstPercentage !== null) {
        normalized.gstPercentage = gstPercentage;
    }

    const serviceCode = toNullableString(
        pickValue(payload, 'serviceCode', 'service_code'),
    );
    if (serviceCode !== undefined) {
        normalized.serviceCode = serviceCode;
    }

    const serviceType = toNullableString(
        pickValue(payload, 'serviceType', 'service_type'),
    );
    if (serviceType !== undefined && serviceType !== null) {
        normalized.serviceType = serviceType;
    }

    const processingDays = toNumber(
        pickValue(payload, 'processingDays', 'processing_days'),
    );
    if (processingDays !== undefined) {
        normalized.processingDays = processingDays;
    }

    const isActive = toBoolean(pickValue(payload, 'isActive', 'is_active'));
    if (isActive !== undefined) {
        normalized.isActive = isActive;
    }

    const isPopular = toBoolean(pickValue(payload, 'isPopular', 'is_popular'));
    if (isPopular !== undefined) {
        normalized.isPopular = isPopular;
    }

    const isFeatured = toBoolean(
        pickValue(payload, 'isFeatured', 'is_featured'),
    );
    if (isFeatured !== undefined) {
        normalized.isFeatured = isFeatured;
    }

    const metadata = toJsonLike(pickValue(payload, 'metadata'));
    if (metadata !== undefined) {
        normalized.metadata = metadata;
    }

    const faqs = toJsonLike(pickValue(payload, 'faqs'));
    if (faqs !== undefined) {
        normalized.faqs = faqs;
    }

    const requiredDocumentsList = toJsonLike(
        pickValue(payload, 'requiredDocumentsList', 'required_documents_list'),
    );
    if (requiredDocumentsList !== undefined) {
        normalized.requiredDocumentsList = requiredDocumentsList;
    }

    const extraDocuments = toJsonLike(
        pickValue(payload, 'extraDocuments', 'extra_documents'),
    );
    if (extraDocuments !== undefined) {
        normalized.extraDocuments = extraDocuments;
    }

    const adminNotes = toNullableString(
        pickValue(payload, 'adminNotes', 'admin_notes'),
    );
    if (adminNotes !== undefined) {
        normalized.adminNotes = adminNotes;
    }

    return normalized;
}

export function toAdminCategoryResource(category: any) {
    const servicesCount = Number(
        (category as any).services_count ??
            (Array.isArray(category.services) ? category.services.length : 0),
    );

    return {
        id: category.id,
        name: category.name,
        category: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        is_active: Boolean(category.isActive),
        isActive: Boolean(category.isActive),
        sort_order: category.sortOrder,
        sortOrder: category.sortOrder,
        services_count: servicesCount,
    };
}

export function toAdminServiceResource(service: any) {
    const base = toServiceResource(service);

    return {
        id: base.id,
        service_category_id: base.service_category_id,
        serviceCategoryId: base.service_category_id,
        name: base.name,
        slug: base.slug,
        short_description: base.short_description,
        shortDescription: base.short_description,
        description: base.description,
        long_description: base.long_description,
        longDescription: base.long_description,
        features: service.features,
        requirements: service.requirements,
        process: service.process,
        link: base.link,
        price: base.price,
        pricing_plans: base.pricing_plans,
        pricingPlans: base.pricing_plans,
        gst_percentage: service.gstPercentage,
        gstPercentage: service.gstPercentage,
        service_code: service.serviceCode,
        serviceCode: service.serviceCode,
        service_type: service.serviceType,
        serviceType: service.serviceType,
        processing_days: service.processingDays,
        processingDays: service.processingDays,
        is_active: Boolean(service.isActive),
        isActive: Boolean(service.isActive),
        is_popular: Boolean(service.isPopular),
        isPopular: Boolean(service.isPopular),
        is_featured: Boolean(service.isFeatured),
        isFeatured: Boolean(service.isFeatured),
        metadata: service.metadata,
        faqs: base.faqs,
        required_documents_list: base.required_documents_list,
        requiredDocumentsList: base.required_documents_list,
        extra_documents: base.extra_documents,
        extraDocuments: base.extra_documents,
        admin_notes: base.admin_notes,
        adminNotes: base.admin_notes,
        category: service.category ? toAdminCategoryResource(service.category) : null,
        documents: base.documents,
    };
}
