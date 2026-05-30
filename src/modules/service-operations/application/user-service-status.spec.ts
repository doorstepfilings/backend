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

  it('returns the default administration application filter when no status is provided', () => {
    expect(buildAdminApplicationWhere()).toEqual({
      status: { notIn: ['in_cart', 'payment_pending'] },
    });
  });

  it('routes unpaid admin filters to payment-pending applications', () => {
    expect(buildAdminApplicationWhere('unpaid')).toEqual({
      status: 'payment_pending',
    });
  });

  it('normalizes legacy paid payment statuses to PAID', () => {
    expect(normalizeLegacyUserServicePaymentStatus('paid')).toBe('PAID');
    expect(normalizeLegacyUserServicePaymentStatus('success')).toBe('PAID');
    expect(normalizeLegacyUserServicePaymentStatus(undefined)).toBe('CREATED');
  });
});
