ALTER TABLE `users`
    ADD COLUMN `district` VARCHAR(255) NULL AFTER `city`,
    ADD COLUMN `landmark` VARCHAR(255) NULL AFTER `pincode`;
