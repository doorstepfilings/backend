import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { authConfig } from './config/auth.config';
import { databaseConfig, type DatabaseConfig } from './config/database.config';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OperationsModule } from './modules/operations/operations.module';
import { HealthModule } from './modules/platform/health/health.module';
import { appEnvironment } from './config/environment';
import { validateEnvironment } from './config/environment.validation';
import { CommunicationModule } from './modules/communication/communication.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SharedModule } from './shared/shared.module';
import { DatabaseBootstrapService } from './database/database-bootstrap.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            expandVariables: true,
            load: [appEnvironment, databaseConfig, authConfig],
            validate: validateEnvironment,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const database =
                    configService.getOrThrow<DatabaseConfig>('database');

                return {
                    type: 'mysql' as const,
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
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/', // serve files starting from root or you can customize it
        }),
        HealthModule,
        IdentityModule,
        // Register authenticated service routes before the public slug route.
        OperationsModule,
        CatalogModule,
        CustomerModule,
        CommunicationModule,
        BackofficeModule,
        SharedModule,
    ],
    providers: [DatabaseBootstrapService],
})
export class AppModule {}
