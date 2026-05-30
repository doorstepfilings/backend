CREATE TABLE `chat_threads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_service_id` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `last_message` TEXT NULL,
    `last_message_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chat_threads_user_service_id_key`(`user_service_id`),
    INDEX `chat_threads_user_service_id_idx`(`user_service_id`),
    INDEX `chat_threads_last_message_at_idx`(`last_message_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_thread_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `thread_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `last_read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chat_thread_participants_thread_user_key`(`thread_id`, `user_id`),
    INDEX `chat_thread_participants_user_id_idx`(`user_id`),
    INDEX `chat_thread_participants_thread_id_idx`(`thread_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `thread_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'text',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `read_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_thread_created_at_idx`(`thread_id`, `created_at`),
    INDEX `chat_messages_sender_id_idx`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chat_threads`
    ADD CONSTRAINT `chat_threads_user_service_id_fkey`
        FOREIGN KEY (`user_service_id`) REFERENCES `user_services`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `chat_thread_participants`
    ADD CONSTRAINT `chat_thread_participants_thread_id_fkey`
        FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `chat_thread_participants`
    ADD CONSTRAINT `chat_thread_participants_user_id_fkey`
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_thread_id_fkey`
        FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_sender_id_fkey`
        FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

ALTER TABLE `chat_messages`
    ADD CONSTRAINT `chat_messages_read_by_id_fkey`
        FOREIGN KEY (`read_by_id`) REFERENCES `users`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
