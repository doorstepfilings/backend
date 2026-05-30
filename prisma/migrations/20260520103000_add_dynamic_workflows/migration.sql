CREATE TABLE `stages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `color` VARCHAR(32) NOT NULL DEFAULT '#1d4ed8',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stages_slug_key`(`slug`),
    INDEX `stages_name_idx`(`name`),
    INDEX `stages_active_name_idx`(`is_active`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `service_workflows` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `service_id` INT NOT NULL,
    `stage_id` INT NOT NULL,
    `position` INT NOT NULL DEFAULT 1,
    `is_required` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_workflows_service_stage_key`(`service_id`, `stage_id`),
    UNIQUE INDEX `service_workflows_service_position_key`(`service_id`, `position`),
    INDEX `service_workflows_service_position_idx`(`service_id`, `position`),
    INDEX `service_workflows_stage_idx`(`stage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workflow_audit_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `service_id` INT NULL,
    `service_workflow_id` INT NULL,
    `stage_id` INT NULL,
    `actor_id` INT NOT NULL,
    `action` VARCHAR(120) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `workflow_audit_logs_service_created_at_idx`(`service_id`, `created_at`),
    INDEX `workflow_audit_logs_workflow_idx`(`service_workflow_id`),
    INDEX `workflow_audit_logs_stage_idx`(`stage_id`),
    INDEX `workflow_audit_logs_actor_created_at_idx`(`actor_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_services`
    ADD COLUMN `current_service_workflow_id` INT NULL AFTER `current_stage_template_id`;

INSERT IGNORE INTO `stages` (`name`, `slug`, `color`, `is_active`)
VALUES
    ('Start', 'start', '#0f766e', TRUE),
    ('Verification', 'verification', '#2563eb', TRUE),
    ('Department Submission', 'department-submission', '#7c3aed', TRUE),
    ('Review', 'review', '#ea580c', TRUE),
    ('Completed', 'completed', '#16a34a', TRUE);

INSERT IGNORE INTO `stages` (`name`, `slug`, `color`, `is_active`, `created_at`, `updated_at`)
SELECT
    `sst`.`name`,
    `sst`.`slug`,
    '#1d4ed8',
    `sst`.`is_active`,
    `sst`.`created_at`,
    `sst`.`updated_at`
FROM `service_stage_templates` AS `sst`;

INSERT INTO `service_workflows` (`service_id`, `stage_id`, `position`, `is_required`, `created_at`, `updated_at`)
SELECT
    `sst`.`service_id`,
    `s`.`id`,
    `sst`.`order_index`,
    TRUE,
    `sst`.`created_at`,
    `sst`.`updated_at`
FROM `service_stage_templates` AS `sst`
INNER JOIN `stages` AS `s`
    ON `s`.`slug` = `sst`.`slug`;

UPDATE `user_services` AS `us`
INNER JOIN `service_stage_templates` AS `sst`
    ON `sst`.`id` = `us`.`current_stage_template_id`
INNER JOIN `stages` AS `s`
    ON `s`.`slug` = `sst`.`slug`
INNER JOIN `service_workflows` AS `sw`
    ON `sw`.`service_id` = `sst`.`service_id`
   AND `sw`.`stage_id` = `s`.`id`
SET `us`.`current_service_workflow_id` = `sw`.`id`
WHERE `us`.`current_stage_template_id` IS NOT NULL;

ALTER TABLE `service_workflows`
    ADD CONSTRAINT `service_workflows_service_id_fkey`
        FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    ADD CONSTRAINT `service_workflows_stage_id_fkey`
        FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

ALTER TABLE `workflow_audit_logs`
    ADD CONSTRAINT `workflow_audit_logs_service_id_fkey`
        FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    ADD CONSTRAINT `workflow_audit_logs_service_workflow_id_fkey`
        FOREIGN KEY (`service_workflow_id`) REFERENCES `service_workflows`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD CONSTRAINT `workflow_audit_logs_stage_id_fkey`
        FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

ALTER TABLE `user_services`
    ADD CONSTRAINT `user_services_current_service_workflow_id_fkey`
        FOREIGN KEY (`current_service_workflow_id`) REFERENCES `service_workflows`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

CREATE INDEX `user_services_current_service_workflow_idx`
    ON `user_services`(`current_service_workflow_id`);

ALTER TABLE `user_services`
    DROP FOREIGN KEY `user_services_current_stage_template_id_fkey`,
    DROP INDEX `user_services_current_stage_template_idx`,
    DROP COLUMN `current_stage_template_id`;
