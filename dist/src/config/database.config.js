"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const config_1 = require("@nestjs/config");
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    database: process.env.DB_NAME ?? 'Accounting',
    host: process.env.DB_HOST ?? '127.0.0.1',
    password: process.env.DB_PASSWORD ?? '',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'root',
}));
//# sourceMappingURL=database.config.js.map