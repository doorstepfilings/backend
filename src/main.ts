import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import type { AppEnvironment } from './config/environment';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';
import {
    buildStorageRoots,
    resolveStorageFilePath,
} from './shared/http/storage-file-resolver';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const configService = app.get(ConfigService);
    const appEnvironment = configService.getOrThrow<AppEnvironment>('app');
    const storageRoots = buildStorageRoots(
        configService.get<string>('LEGACY_STORAGE_ROOTS'),
    );
    const httpAdapter = app.getHttpAdapter().getInstance();

    // Preserve access to documents that still live in the old Laravel storage.
    httpAdapter.use(
        '/storage',
        (request: Request, response: Response, next: NextFunction) => {
            if (request.method !== 'GET' && request.method !== 'HEAD') {
                next();
                return;
            }

            const resolvedFilePath = resolveStorageFilePath(
                request.path,
                storageRoots,
            );

            if (resolvedFilePath === null) {
                next();
                return;
            }

            response.sendFile(resolvedFilePath, (error) => {
                if (error) {
                    next(error);
                }
            });
        },
    );

    app.setGlobalPrefix(appEnvironment.apiPrefix);
    app.enableCors({
        origin: [appEnvironment.frontendUrl],
        credentials: true,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());

    await app.listen(appEnvironment.port);
}

void bootstrap();
