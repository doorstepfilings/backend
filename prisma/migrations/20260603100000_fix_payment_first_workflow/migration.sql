INSERT INTO `stages` (
  `name`,
  `slug`,
  `color`,
  `is_active`,
  `is_default`,
  `created_at`,
  `updated_at`
)
VALUES
  (
    'Payment Verification',
    'payment-verification',
    '#2563eb',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
  ),
  (
    'Start',
    'start',
    '#0f766e',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
  ),
  (
    'Cancelled',
    'cancelled',
    '#64748b',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
  ),
  (
    'Completed',
    'completed',
    '#16a34a',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
  )
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `color` = VALUES(`color`),
  `is_active` = TRUE,
  `is_default` = TRUE,
  `updated_at` = CURRENT_TIMESTAMP(3);

UPDATE `stages`
SET
  `is_active` = TRUE,
  `is_default` = TRUE,
  `updated_at` = CURRENT_TIMESTAMP(3)
WHERE `slug` IN (
  'payment-verification',
  'start',
  'cancelled',
  'completed'
);

DELETE FROM `default_service_workflows`;

INSERT INTO `default_service_workflows` (
  `stage_id`,
  `position`,
  `is_required`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  1,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `stages`
WHERE `slug` = 'payment-verification'
LIMIT 1;

INSERT INTO `default_service_workflows` (
  `stage_id`,
  `position`,
  `is_required`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  2,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `stages`
WHERE `slug` = 'start'
LIMIT 1;

INSERT INTO `default_service_workflows` (
  `stage_id`,
  `position`,
  `is_required`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  3,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `stages`
WHERE `slug` = 'cancelled'
LIMIT 1;

INSERT INTO `default_service_workflows` (
  `stage_id`,
  `position`,
  `is_required`,
  `created_at`,
  `updated_at`
)
SELECT
  `id`,
  4,
  TRUE,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `stages`
WHERE `slug` = 'completed'
LIMIT 1;

DROP INDEX `service_workflows_service_stage_key` ON `service_workflows`;

CREATE INDEX `service_workflows_service_stage_idx`
  ON `service_workflows`(`service_id`, `stage_id`);
