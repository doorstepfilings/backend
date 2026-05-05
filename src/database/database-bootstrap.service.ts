import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
    private readonly logger = new Logger(DatabaseBootstrapService.name);

    constructor(private readonly dataSource: DataSource) {}

    async onApplicationBootstrap() {
        await this.ensureOtpVerificationsTable();
    }

    private async ensureOtpVerificationsTable() {
        await this.dataSource.query(`
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                identifier VARCHAR(255) NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                verified TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_otp_verifications_identifier (identifier),
                INDEX idx_otp_verifications_lookup (identifier, otp, verified),
                INDEX idx_otp_verifications_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        this.logger.log('Ensured otp_verifications table exists.');
    }
}
