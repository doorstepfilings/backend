"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appEnvironment = void 0;
const config_1 = require("@nestjs/config");
exports.appEnvironment = (0, config_1.registerAs)('app', () => ({
    apiPrefix: process.env.API_PREFIX ?? 'api',
    appName: process.env.APP_NAME ?? 'doorstep-backend',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4000),
    twilio: {
        sid: process.env.TWILIO_SID ?? '',
        token: process.env.TWILIO_AUTH_TOKEN ?? '',
        number: process.env.TWILIO_NUMBER ?? '',
    },
}));
//# sourceMappingURL=environment.js.map