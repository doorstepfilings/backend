-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(255) NOT NULL DEFAULT 'user',
    `mobile_number` VARCHAR(255) NULL,
    `is_mobile_verified` BOOLEAN NOT NULL DEFAULT false,
    `referral_code` VARCHAR(255) NULL,
    `rm_unique_id` VARCHAR(255) NULL,
    `accountant_unique_id` VARCHAR(255) NULL,
    `rm_id` INTEGER NULL,
    `accountant_id` INTEGER NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `pincode` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(255) NOT NULL,
    `otp` VARCHAR(10) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `service_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_category_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `short_description` TEXT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `link` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `long_description` LONGTEXT NULL,
    `features` TEXT NULL,
    `requirements` TEXT NULL,
    `process` TEXT NULL,
    `price` DECIMAL(10, 2) NULL,
    `pricing_plans` JSON NULL,
    `gst_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
    `service_code` VARCHAR(255) NULL,
    `service_type` VARCHAR(255) NOT NULL DEFAULT 'standard',
    `processing_days` INTEGER NOT NULL DEFAULT 7,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_popular` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `faqs` JSON NULL,
    `required_documents_list` JSON NULL,
    `extra_documents` JSON NULL,
    `admin_notes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `document_name` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `slug` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `document_type` VARCHAR(255) NOT NULL DEFAULT 'required',
    `file_type` VARCHAR(255) NOT NULL DEFAULT 'pdf',
    `max_size` INTEGER NOT NULL DEFAULT 5,
    `is_required` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255) NULL,
    `service` VARCHAR(255) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `accountant_id` INTEGER NULL,
    `application_unique_id` VARCHAR(191) NULL,
    `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
    `payment_status` VARCHAR(255) NOT NULL DEFAULT 'pending',
    `form_data` JSON NULL,
    `documents` JSON NULL,
    `amount` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `revision_notes` TEXT NULL,
    `ca_notes` TEXT NULL,
    `update_note` TEXT NULL,
    `rejection_reason` TEXT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `certificate_url` VARCHAR(255) NULL,
    `submitted_to_ca_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_services_application_unique_id_key`(`application_unique_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_request_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_service_id` INTEGER NOT NULL,
    `service_document_id` INTEGER NULL,
    `uploaded_by` INTEGER NOT NULL,
    `source_document_id` INTEGER NULL,
    `document_name` VARCHAR(255) NULL,
    `document_type` VARCHAR(255) NULL,
    `document_category` VARCHAR(255) NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_extension` VARCHAR(50) NULL,
    `file_size` BIGINT NULL,
    `mime_type` VARCHAR(100) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `user_service_id` INTEGER NULL,
    `payment_provider_order_id` VARCHAR(255) NULL,
    `payment_provider_transaction_id` VARCHAR(255) NULL,
    `payment_provider` VARCHAR(255) NOT NULL DEFAULT 'razorpay',
    `payment_provider_status` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `payment_method` VARCHAR(50) NULL,
    `order_unique_id` VARCHAR(191) NULL,
    `invoice_unique_id` VARCHAR(191) NULL,
    `notes` JSON NULL,
    `refund_id` VARCHAR(255) NULL,
    `refund_amount` DECIMAL(10, 2) NULL,
    `refund_reason` TEXT NULL,
    `refund_status` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_order_unique_id_key`(`order_unique_id`),
    UNIQUE INDEX `payments_invoice_unique_id_key`(`invoice_unique_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_rm_id_fkey` FOREIGN KEY (`rm_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_accountant_id_fkey` FOREIGN KEY (`accountant_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_service_category_id_fkey` FOREIGN KEY (`service_category_id`) REFERENCES `service_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_documents` ADD CONSTRAINT `service_documents_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_accountant_id_fkey` FOREIGN KEY (`accountant_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_services` ADD CONSTRAINT `user_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_request_documents` ADD CONSTRAINT `service_request_documents_user_service_id_fkey` FOREIGN KEY (`user_service_id`) REFERENCES `user_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_request_documents` ADD CONSTRAINT `service_request_documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_service_id_fkey` FOREIGN KEY (`user_service_id`) REFERENCES `user_services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
