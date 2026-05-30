import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdministrationModule } from './modules/administration/administration.module';
import { authConfig } from './config/auth.config';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ServiceOperationsModule } from './modules/service-operations/service-operations.module';
import { HealthModule } from './modules/platform/health/health.module';
import { appEnvironment } from './config/environment';
import { validateEnvironment } from './config/environment.validation';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { SharedModule } from './shared/shared.module';
import { MediaModule } from './modules/media/media.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ChatModule } from './modules/chat/chat.module';
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
    ServiceOperationsModule,
    CatalogModule,
    EnquiriesModule,
    NotificationsModule,
    AdministrationModule,
    SharedModule,
    MediaModule,
    ChatModule,
  ],
  providers: [],
})
export class AppModule {}
