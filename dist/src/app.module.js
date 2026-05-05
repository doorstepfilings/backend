"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const backoffice_module_1 = require("./modules/backoffice/backoffice.module");
const auth_config_1 = require("./config/auth.config");
const database_config_1 = require("./config/database.config");
const catalog_module_1 = require("./modules/catalog/catalog.module");
const identity_module_1 = require("./modules/identity/identity.module");
const operations_module_1 = require("./modules/operations/operations.module");
const health_module_1 = require("./modules/platform/health/health.module");
const environment_1 = require("./config/environment");
const environment_validation_1 = require("./config/environment.validation");
const communication_module_1 = require("./modules/communication/communication.module");
const customer_module_1 = require("./modules/customer/customer.module");
const shared_module_1 = require("./shared/shared.module");
const database_bootstrap_service_1 = require("./database/database-bootstrap.service");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                expandVariables: true,
                load: [environment_1.appEnvironment, database_config_1.databaseConfig, auth_config_1.authConfig],
                validate: environment_validation_1.validateEnvironment,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const database = configService.getOrThrow('database');
                    return {
                        type: 'mysql',
                        autoLoadEntities: true,
                        database: database.database,
                        host: database.host,
                        password: database.password,
                        port: database.port,
                        synchronize: false,
                        username: database.username,
                    };
                },
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
                serveRoot: '/',
            }),
            health_module_1.HealthModule,
            identity_module_1.IdentityModule,
            operations_module_1.OperationsModule,
            catalog_module_1.CatalogModule,
            customer_module_1.CustomerModule,
            communication_module_1.CommunicationModule,
            backoffice_module_1.BackofficeModule,
            shared_module_1.SharedModule,
        ],
        providers: [database_bootstrap_service_1.DatabaseBootstrapService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map