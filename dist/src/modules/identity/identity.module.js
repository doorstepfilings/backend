"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const auth_service_1 = require("./application/auth.service");
const profile_service_1 = require("./application/profile.service");
const jwt_auth_guard_1 = require("./infrastructure/auth/jwt-auth.guard");
const jwt_strategy_1 = require("./infrastructure/auth/jwt.strategy");
const user_entity_1 = require("./infrastructure/persistence/user.entity");
const otp_verification_entity_1 = require("./infrastructure/persistence/otp-verification.entity");
const auth_controller_1 = require("./presentation/http/auth.controller");
const profile_controller_1 = require("./presentation/http/profile.controller");
let IdentityModule = class IdentityModule {
};
exports.IdentityModule = IdentityModule;
exports.IdentityModule = IdentityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.UserEntity, otp_verification_entity_1.OtpVerificationEntity]),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const auth = configService.getOrThrow('auth');
                    return {
                        secret: auth.jwtSecret,
                        signOptions: {
                            expiresIn: auth.jwtExpiresIn,
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController, profile_controller_1.ProfileController],
        providers: [auth_service_1.AuthService, profile_service_1.ProfileService, jwt_strategy_1.JwtStrategy, jwt_auth_guard_1.JwtAuthGuard],
        exports: [auth_service_1.AuthService, profile_service_1.ProfileService, jwt_auth_guard_1.JwtAuthGuard, typeorm_1.TypeOrmModule],
    })
], IdentityModule);
//# sourceMappingURL=identity.module.js.map