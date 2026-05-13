import {
    buildAdminApplicationWhere,
    normalizeLegacyUserServicePaymentStatus,
    REVIEW_QUEUE_APPLICATION_STATUSES,
} from './user-service-status';

describe('user-service-status helpers', () => {
    it('maps pending review filters to the active review queue statuses', () => {
        expect(buildAdminApplicationWhere('pending')).toEqual({
            status: {
                in: [...REVIEW_QUEUE_APPLICATION_STATUSES],
            },
        });
    });

    it('returns the default backoffice application filter when no status is provided', () => {
        expect(buildAdminApplicationWhere()).toEqual({
            status: { not: 'in_cart' },
        });
    });

    it('normalizes legacy paid payment statuses to success', () => {
        expect(normalizeLegacyUserServicePaymentStatus('paid')).toBe(
            'success',
        );
        expect(normalizeLegacyUserServicePaymentStatus('success')).toBe(
            'success',
        );
        expect(normalizeLegacyUserServicePaymentStatus(undefined)).toBe(
            'pending',
        );
    });
});
