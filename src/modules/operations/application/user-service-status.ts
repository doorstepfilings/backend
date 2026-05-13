import type { Prisma } from '@prisma/client';

export const REVIEW_QUEUE_APPLICATION_STATUSES = [
    'pending',
    'applied',
    'paid',
    'under_review',
    'update_required',
    'in_progress',
    'submitted_to_ca',
    'document_collection',
] as const;

function normalizeStatus(value: string | null | undefined) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function buildAdminApplicationWhere(
    status?: string,
): Prisma.UserServiceWhereInput {
    const normalizedStatus = normalizeStatus(status);

    if (!normalizedStatus || normalizedStatus === 'all') {
        return { status: { not: 'in_cart' } };
    }

    if (
        normalizedStatus === 'pending' ||
        normalizedStatus === 'active' ||
        normalizedStatus === 'review'
    ) {
        return {
            status: {
                in: [...REVIEW_QUEUE_APPLICATION_STATUSES],
            },
        };
    }

    if (normalizedStatus === 'processing') {
        return { status: 'in_progress' };
    }

    return { status: normalizedStatus };
}

export function normalizeLegacyUserServicePaymentStatus(
    status: string | null | undefined,
) {
    const normalizedStatus = normalizeStatus(status);

    if (!normalizedStatus) {
        return 'pending';
    }

    if (normalizedStatus === 'paid') {
        return 'success';
    }

    return normalizedStatus;
}
