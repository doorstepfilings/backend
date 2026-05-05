"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
const config_1 = require("@nestjs/config");
exports.authConfig = (0, config_1.registerAs)('auth', () => ({
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-before-production',
}));
//# sourceMappingURL=auth.config.js.map