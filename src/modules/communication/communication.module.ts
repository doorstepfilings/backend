import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { existsSync } from 'fs';
import { NotificationService } from './notification.service';
import { AppEnvironment } from '../../config/environment';

const getTemplatesDir = () => {
    const paths = [
        join(__dirname, 'templates'),
        join(__dirname, '..', 'templates'),
        join(__dirname, '..', '..', 'modules', 'communication', 'templates'),
        join(process.cwd(), 'src', 'modules', 'communication', 'templates'),
        join(process.cwd(), 'dist', 'modules', 'communication', 'templates'),
    ];

    for (const p of paths) {
        if (existsSync(p)) return p;
    }
    return join(__dirname, 'templates');
};


@Global()
@Module({
    imports: [
        ConfigModule,
        MailerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const mailConfig = config.getOrThrow<AppEnvironment['mail']>('app.mail');
                return {
                    transport: {
                        host: mailConfig.host,
                        port: mailConfig.port,
                        secure: mailConfig.encryption === 'ssl' || mailConfig.port === 465,
                        auth: {
                            user: mailConfig.user,
                            pass: mailConfig.pass,
                        },
                        tls: {
                            rejectUnauthorized: false,
                        },
                    },
                    defaults: {
                        from: `"${mailConfig.fromName}" <${mailConfig.from}>`,
                    },

                    template: {
                        dir: getTemplatesDir(),
                        adapter: new HandlebarsAdapter(),
                        options: { strict: true },
                    },

                };
            },
        }),
    ],

    providers: [NotificationService],
    exports: [NotificationService],
})
export class CommunicationModule {}
