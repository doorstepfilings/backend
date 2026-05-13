import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { authConfig } from './config/auth.config';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from './modules/identity/identity.module';
import { OperationsModule } from './modules/operations/operations.module';
import { HealthModule } from './modules/platform/health/health.module';
import { appEnvironment } from './config/environment';
import { validateEnvironment } from './config/environment.validation';
import { CommunicationModule } from './modules/communication/communication.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SharedModule } from './shared/shared.module';
import { MediaModule } from './modules/media/media.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            expandVariables: true,
            load: [appEnvironment, authConfig],
            validate: validateEnvironment,
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
        MediaModule,
    ],
    providers: [],
})
export class AppModule {}
