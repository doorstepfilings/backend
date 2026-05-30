export const PAYMENT_STATUS = {
  CANCELLED: 'CANCELLED',
  CREATED: 'CREATED',
  FAILED: 'FAILED',
  PAID: 'PAID',
  PENDING: 'PENDING',
  REFUNDED: 'REFUNDED',
} as const;

export const USER_SERVICE_PAYMENT_PENDING_STATUS = 'payment_pending';

export const HIDDEN_USER_SERVICE_STATUSES = [
  'in_cart',
  USER_SERVICE_PAYMENT_PENDING_STATUS,
] as const;

const PAID_PAYMENT_STATUS_VALUES = [
  PAYMENT_STATUS.PAID,
  'paid',
  'success',
] as const;

const ACTIVE_PAYMENT_STATUS_VALUES = [
  PAYMENT_STATUS.CREATED,
  PAYMENT_STATUS.PENDING,
  'authorized',
  'created',
  'pending',
] as const;

const RETRYABLE_PAYMENT_STATUS_VALUES = [
  PAYMENT_STATUS.CREATED,
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.CANCELLED,
  'abandoned',
  'cancelled',
  'canceled',
  'created',
  'failed',
  'pending',
] as const;

export function getPaidPaymentStatusValues() {
  return [...PAID_PAYMENT_STATUS_VALUES];
}

export function getActivePaymentStatusValues() {
  return [...ACTIVE_PAYMENT_STATUS_VALUES];
}

export function getRetryablePaymentStatusValues() {
  return [...RETRYABLE_PAYMENT_STATUS_VALUES];
}

export function normalizePaymentStatus(value: string | null | undefined) {
  const normalized =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  switch (normalized) {
    case '':
      return PAYMENT_STATUS.CREATED;
    case 'ABANDONED':
    case 'CANCELED':
      return PAYMENT_STATUS.CANCELLED;
    case 'AUTHORIZED':
      return PAYMENT_STATUS.PENDING;
    case 'CAPTURED':
    case 'SUCCESS':
      return PAYMENT_STATUS.PAID;
    default:
      return normalized;
  }
}

export function isPaidPaymentStatus(value: string | null | undefined) {
  const normalized = normalizePaymentStatus(value);
  return (
    normalized === PAYMENT_STATUS.PAID || normalized === PAYMENT_STATUS.REFUNDED
  );
}

export function normalizePaymentProviderStatus(
  value: string | null | undefined,
) {
  const normalized =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!normalized) {
    return '';
  }

  if (normalized === 'captured') {
    return 'captured';
  }

  if (normalized === 'authorized') {
    return 'authorized';
  }

  if (normalized === 'failed') {
    return 'failed';
  }

  return normalized;
}

export function isSettledPaymentRecord(payment: {
  paymentProviderStatus?: string | null;
  paymentProviderTransactionId?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
}) {
  return (
    isPaidPaymentStatus(payment.paymentStatus ?? payment.status) ||
    normalizePaymentProviderStatus(payment.paymentProviderStatus) ===
      'captured' ||
    Boolean(payment.paymentProviderTransactionId)
  );
}

export function resolveDismissedPaymentStatus(reason?: string | null) {
  const normalizedReason =
    typeof reason === 'string' ? reason.trim().toLowerCase() : '';

  if (
    normalizedReason.includes('cancel') ||
    normalizedReason.includes('close') ||
    normalizedReason.includes('dismiss') ||
    normalizedReason.includes('abandon')
  ) {
    return PAYMENT_STATUS.CANCELLED;
  }

  return PAYMENT_STATUS.FAILED;
}
