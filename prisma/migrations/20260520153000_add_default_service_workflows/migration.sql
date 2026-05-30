CREATE TABLE `default_service_workflows` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `stage_id` INT NOT NULL,
    `position` INT NOT NULL DEFAULT 1,
    `is_required` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `default_service_workflows_stage_key`(`stage_id`),
    UNIQUE INDEX `default_service_workflows_position_key`(`position`),
    INDEX `default_service_workflows_position_idx`(`position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `default_service_workflows`
    ADD CONSTRAINT `default_service_workflows_stage_id_fkey`
        FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

INSERT INTO `default_service_workflows` (`stage_id`, `position`, `is_required`)
SELECT `id`, 1, TRUE
FROM `stages`
WHERE `slug` = 'start'
LIMIT 1;

INSERT INTO `default_service_workflows` (`stage_id`, `position`, `is_required`)
SELECT `id`, 2, TRUE
FROM `stages`
WHERE `slug` = 'review'
LIMIT 1;

INSERT INTO `default_service_workflows` (`stage_id`, `position`, `is_required`)
SELECT `id`, 3, TRUE
FROM `stages`
WHERE `slug` = 'verification'
LIMIT 1;

INSERT INTO `default_service_workflows` (`stage_id`, `position`, `is_required`)
SELECT `id`, 4, TRUE
FROM `stages`
WHERE `slug` = 'completed'
LIMIT 1;
