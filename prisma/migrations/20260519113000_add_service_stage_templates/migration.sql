ALTER TABLE `user_services`
    ADD COLUMN `client_message` TEXT NULL AFTER `rejection_reason`,
    ADD COLUMN `current_stage_template_id` INT NULL AFTER `certificate_url`,
    ADD COLUMN `current_stage_updated_at` DATETIME(3) NULL AFTER `current_stage_template_id`;

CREATE TABLE `service_stage_templates` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `service_id` INT NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `order_index` INT NOT NULL DEFAULT 1,
    `is_client_visible` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_stage_templates_service_slug_key`(`service_id`, `slug`),
    INDEX `service_stage_templates_service_order_idx`(`service_id`, `order_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `user_services_current_stage_template_idx`
    ON `user_services`(`current_stage_template_id`);

ALTER TABLE `service_stage_templates`
    ADD CONSTRAINT `service_stage_templates_service_id_fkey`
        FOREIGN KEY (`service_id`) REFERENCES `services`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `user_services`
    ADD CONSTRAINT `user_services_current_stage_template_id_fkey`
        FOREIGN KEY (`current_stage_template_id`) REFERENCES `service_stage_templates`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
