"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const api_exception_filter_1 = require("./shared/http/api-exception.filter");
const storage_file_resolver_1 = require("./shared/http/storage-file-resolver");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const configService = app.get(config_1.ConfigService);
    const appEnvironment = configService.getOrThrow('app');
    const storageRoots = (0, storage_file_resolver_1.buildStorageRoots)(configService.get('LEGACY_STORAGE_ROOTS'));
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.use('/storage', (request, response, next) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            next();
            return;
        }
        const resolvedFilePath = (0, storage_file_resolver_1.resolveStorageFilePath)(request.path, storageRoots);
        if (resolvedFilePath === null) {
            next();
            return;
        }
        response.sendFile(resolvedFilePath, (error) => {
            if (error) {
                next(error);
            }
        });
    });
    app.setGlobalPrefix(appEnvironment.apiPrefix);
    app.enableCors({
        origin: [appEnvironment.frontendUrl],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    await app.listen(appEnvironment.port);
}
void bootstrap();
//# sourceMappingURL=main.js.map