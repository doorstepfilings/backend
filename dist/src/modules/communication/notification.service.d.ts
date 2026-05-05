import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
export declare class NotificationService {
    private readonly mailerService;
    private readonly configService;
    private readonly logger;
    private twilioClient;
    constructor(mailerService: MailerService, configService: ConfigService);
    private get dashboardUrl();
    private get year();
    sendEmail(to: string, subject: string, template: string, context: Record<string, unknown>): Promise<void>;
    sendSms(to: string, body: string): Promise<void>;
    sendServiceAppliedNotification(user: {
        email?: string | null;
        name?: string | null;
        id?: number;
    }, service: {
        name?: string | null;
    }): void;
    sendServiceFinalizedNotification(user: {
        email?: string | null;
        name?: string | null;
    }, userService: {
        id: number;
        service?: {
            name?: string | null;
        } | null;
        certificateUrl?: string | null;
    }): void;
    sendPaymentSuccessNotification(user: {
        email?: string | null;
        name?: string | null;
    }, payment: {
        amount: number;
        orderUniqueId?: string | null;
        invoiceUniqueId?: string | null;
    }, serviceName?: string): void;
    sendRefundNotification(user: {
        email?: string | null;
        name?: string | null;
    }, payment: {
        refundAmount?: number | null;
        orderUniqueId?: string | null;
        refundReason?: string | null;
    }): void;
    sendRegisterOtpNotification(to: string, otp: string): void;
    sendWelcomeNotification(user: {
        email?: string | null;
        name?: string | null;
    }): void;
    sendAccountantAssignmentNotification(accountant: {
        email?: string | null;
        name?: string | null;
    }, client: {
        name?: string | null;
    }): void;
    sendServiceAssignmentNotification(accountant: {
        email?: string | null;
        name?: string | null;
    }, userService: {
        id: number;
        user?: {
            name?: string | null;
        } | null;
        service?: {
            name?: string | null;
        } | null;
    }): void;
}
