ALTER TABLE `stages`
    ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT FALSE AFTER `is_active`;

UPDATE `stages`
SET `is_default` = TRUE
WHERE `slug` IN (
    'start',
    'verification',
    'department-submission',
    'review',
    'completed'
);
