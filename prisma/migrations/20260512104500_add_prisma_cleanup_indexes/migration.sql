-- Tighten Prisma-native uniqueness and add the secondary indexes
-- required by the current NestJS query patterns.

ALTER TABLE `users`
    MODIFY `role` VARCHAR(50) NOT NULL DEFAULT 'user',
    MODIFY `mobile_number` VARCHAR(50) NULL,
    MODIFY `rm_unique_id` VARCHAR(191) NULL,
    MODIFY `accountant_unique_id` VARCHAR(191) NULL,
    ADD UNIQUE INDEX `users_rm_unique_id_key`(`rm_unique_id`),
    ADD UNIQUE INDEX `users_accountant_unique_id_key`(`accountant_unique_id`),
    ADD INDEX `users_role_created_at_idx`(`role`, `created_at`),
    ADD INDEX `users_mobile_number_idx`(`mobile_number`),
    ADD INDEX `users_rm_id_role_idx`(`rm_id`, `role`),
    ADD INDEX `users_accountant_id_role_idx`(`accountant_id`, `role`);

ALTER TABLE `otp_verifications`
    MODIFY `identifier` VARCHAR(191) NOT NULL,
    ADD INDEX `otp_identifier_verified_created_at_idx`(`identifier`, `verified`, `created_at`),
    ADD INDEX `otp_identifier_otp_verified_created_at_idx`(`identifier`, `otp`, `verified`, `created_at`);

ALTER TABLE `service_categories`
    MODIFY `name` VARCHAR(191) NOT NULL,
    ADD INDEX `service_categories_sort_order_name_idx`(`sort_order`, `name`);

ALTER TABLE `services`
    MODIFY `name` VARCHAR(191) NOT NULL,
    ADD UNIQUE INDEX `services_slug_key`(`slug`),
    ADD INDEX `services_category_name_idx`(`service_category_id`, `name`);

ALTER TABLE `service_documents`
    ADD INDEX `service_documents_service_sort_order_idx`(`service_id`, `sort_order`);

ALTER TABLE `enquiries`
    MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    ADD INDEX `enquiries_created_at_idx`(`created_at`),
    ADD INDEX `enquiries_status_created_at_idx`(`status`, `created_at`);

ALTER TABLE `user_services`
    MODIFY `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
    MODIFY `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    ADD INDEX `user_services_status_idx`(`status`),
    ADD INDEX `user_services_payment_status_idx`(`payment_status`),
    ADD INDEX `user_services_created_at_idx`(`created_at`),
    ADD INDEX `user_services_user_status_idx`(`user_id`, `status`),
    ADD INDEX `user_services_user_service_status_idx`(`user_id`, `service_id`, `status`),
    ADD INDEX `user_services_user_payment_status_idx`(`user_id`, `payment_status`),
    ADD INDEX `user_services_service_status_idx`(`service_id`, `status`),
    ADD INDEX `user_services_accountant_status_idx`(`accountant_id`, `status`),
    ADD INDEX `user_services_accountant_updated_at_idx`(`accountant_id`, `updated_at`);

ALTER TABLE `service_request_documents`
    MODIFY `document_name` VARCHAR(191) NULL,
    ADD INDEX `srd_source_document_idx`(`source_document_id`),
    ADD INDEX `srd_user_service_created_at_idx`(`user_service_id`, `created_at`),
    ADD INDEX `srd_uploaded_by_created_at_idx`(`uploaded_by`, `created_at`),
    ADD INDEX `srd_user_service_service_document_idx`(`user_service_id`, `service_document_id`),
    ADD INDEX `srd_user_service_doc_name_version_idx`(`user_service_id`, `document_name`, `version`);

ALTER TABLE `payments`
    MODIFY `payment_provider_order_id` VARCHAR(191) NULL,
    MODIFY `payment_provider_transaction_id` VARCHAR(191) NULL,
    ADD INDEX `payments_provider_order_idx`(`payment_provider_order_id`),
    ADD INDEX `payments_provider_txn_idx`(`payment_provider_transaction_id`),
    ADD INDEX `payments_user_created_at_idx`(`user_id`, `created_at`),
    ADD INDEX `payments_user_status_created_at_idx`(`user_id`, `status`, `created_at`),
    ADD INDEX `payments_user_service_status_idx`(`user_service_id`, `status`),
    ADD INDEX `payments_status_created_at_idx`(`status`, `created_at`);
