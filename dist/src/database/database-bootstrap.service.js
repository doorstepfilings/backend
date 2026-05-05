"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseBootstrapService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseBootstrapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
let DatabaseBootstrapService = DatabaseBootstrapService_1 = class DatabaseBootstrapService {
    dataSource;
    logger = new common_1.Logger(DatabaseBootstrapService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onApplicationBootstrap() {
        await this.ensureOtpVerificationsTable();
    }
    async ensureOtpVerificationsTable() {
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
};
exports.DatabaseBootstrapService = DatabaseBootstrapService;
exports.DatabaseBootstrapService = DatabaseBootstrapService = DatabaseBootstrapService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DatabaseBootstrapService);
//# sourceMappingURL=database-bootstrap.service.js.map