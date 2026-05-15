UPDATE `payments`
SET `payment_status` = CASE
    WHEN `payment_status` IS NULL OR TRIM(`payment_status`) = '' THEN 'CREATED'
    WHEN LOWER(`payment_status`) IN ('paid', 'success', 'captured') THEN 'PAID'
    WHEN LOWER(`payment_status`) = 'failed' THEN 'FAILED'
    WHEN LOWER(`payment_status`) IN ('cancelled', 'canceled', 'abandoned') THEN 'CANCELLED'
    WHEN LOWER(`payment_status`) IN ('pending', 'authorized') THEN 'PENDING'
    WHEN LOWER(`payment_status`) = 'refunded' THEN 'PAID'
    ELSE UPPER(`payment_status`)
END;

UPDATE `payments`
SET `status` = CASE
    WHEN `status` IS NULL OR TRIM(`status`) = '' THEN 'CREATED'
    WHEN LOWER(`status`) IN ('paid', 'success', 'captured') THEN 'PAID'
    WHEN LOWER(`status`) = 'failed' THEN 'FAILED'
    WHEN LOWER(`status`) IN ('cancelled', 'canceled', 'abandoned') THEN 'CANCELLED'
    WHEN LOWER(`status`) IN ('pending', 'authorized') THEN 'PENDING'
    WHEN LOWER(`status`) = 'refunded' THEN 'REFUNDED'
    ELSE UPPER(`status`)
END;

UPDATE `user_services`
SET `payment_status` = CASE
    WHEN `payment_status` IS NULL OR TRIM(`payment_status`) = '' THEN 'CREATED'
    WHEN LOWER(`payment_status`) IN ('paid', 'success', 'captured') THEN 'PAID'
    WHEN LOWER(`payment_status`) = 'failed' THEN 'FAILED'
    WHEN LOWER(`payment_status`) IN ('cancelled', 'canceled', 'abandoned') THEN 'CANCELLED'
    WHEN LOWER(`payment_status`) IN ('pending', 'authorized') THEN 'PENDING'
    ELSE UPPER(`payment_status`)
END;

UPDATE `user_services`
SET `status` = 'payment_pending'
WHERE `payment_status` <> 'PAID'
  AND `status` NOT IN ('in_cart', 'payment_pending', 'cancelled', 'rejected', 'approved', 'completed');

ALTER TABLE `user_services`
    MODIFY `payment_status` VARCHAR(50) NOT NULL DEFAULT 'CREATED';

ALTER TABLE `payments`
    MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    MODIFY `payment_status` VARCHAR(50) NOT NULL DEFAULT 'CREATED';

DROP INDEX `payments_provider_order_idx` ON `payments`;
DROP INDEX `payments_provider_txn_idx` ON `payments`;

CREATE UNIQUE INDEX `payments_payment_provider_order_id_key`
    ON `payments`(`payment_provider_order_id`);

CREATE UNIQUE INDEX `payments_payment_provider_transaction_id_key`
    ON `payments`(`payment_provider_transaction_id`);
