import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import type { AppEnvironment } from '../../config/environment';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private twilioClient: Twilio | null = null;

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) {
        const twilioConfig = this.configService.get<AppEnvironment['twilio']>('app.twilio');
        if (twilioConfig?.sid && twilioConfig?.token) {
            this.twilioClient = new Twilio(twilioConfig.sid, twilioConfig.token);
        }
    }

    private get dashboardUrl(): string {
        const frontendUrl = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000');
        return `${frontendUrl}/dashboard`;
    }

    private get year(): number {
        return new Date().getFullYear();
    }

    async sendEmail(
        to: string,
        subject: string,
        template: string,
        context: Record<string, unknown>,
    ) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                template: `./${template}`,
                context: { ...context, year: this.year, dashboardUrl: this.dashboardUrl },
            });
            this.logger.log(`Email sent to ${to} [${template}]`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        }
    }

    async sendSms(to: string, body: string) {
        if (!this.twilioClient) {
            this.logger.warn('Twilio client not initialized. Skipping SMS.');
            return;
        }

        const twilioConfig = this.configService.getOrThrow<AppEnvironment['twilio']>('app.twilio');

        try {
            const formattedTo = to.startsWith('+') ? to : `+${to}`;
            await this.twilioClient.messages.create({
                body,
                from: twilioConfig.number,
                to: formattedTo,
            });
            this.logger.log(`SMS sent to ${formattedTo}`);
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
        }
    }

    // ─── Service Lifecycle ─────────────────────────────────────────────────────

    sendServiceAppliedNotification(
        user: { email?: string | null; name?: string | null; id?: number },
        service: { name?: string | null },
    ) {
        if (!user.email) return;
        this.sendEmail(user.email, 'Service Application Received', 'service-applied', {
            userName: user.name ?? 'User',
            serviceName: service.name ?? 'Service',
            referenceId: `#${String(user.id ?? 0).padStart(6, '0')}`,
        });
    }

    sendServiceFinalizedNotification(
        user: { email?: string | null; name?: string | null },
        userService: { id: number; service?: { name?: string | null } | null; certificateUrl?: string | null },
    ) {
        if (!user.email) return;
        this.sendEmail(user.email, 'Your Service Has Been Completed', 'service-finalized', {
            userName: user.name ?? 'User',
            serviceName: userService.service?.name ?? 'Service',
            referenceId: `#${String(userService.id).padStart(6, '0')}`,
            certificateUrl: userService.certificateUrl ?? null,
        });
    }

    // ─── Payments ──────────────────────────────────────────────────────────────

    sendPaymentSuccessNotification(
        user: { email?: string | null; name?: string | null },
        payment: { amount: number; orderUniqueId?: string | null; invoiceUniqueId?: string | null },
        serviceName: string = 'Service Purchase',
    ) {
        if (!user.email) return;
        this.sendEmail(user.email, 'Payment Successful - DoorstepFilings', 'payment-success', {
            userName: user.name ?? 'User',
            amount: payment.amount.toFixed(2),
            orderUniqueId: payment.orderUniqueId ?? 'N/A',
            serviceName,
        });
    }

    sendRefundNotification(
        user: { email?: string | null; name?: string | null },
        payment: { refundAmount?: number | null; orderUniqueId?: string | null; refundReason?: string | null },
    ) {
        if (!user.email) return;
        this.sendEmail(user.email, 'Refund Initiated - DoorstepFilings', 'refund', {
            userName: user.name ?? 'User',
            refundAmount: (payment.refundAmount ?? 0).toFixed(2),
            orderUniqueId: payment.orderUniqueId ?? 'N/A',
            refundReason: payment.refundReason ?? 'Customer request',
        });
    }

    // ─── Auth / OTP ────────────────────────────────────────────────────────────

    sendRegisterOtpNotification(to: string, otp: string) {
        this.sendEmail(to, 'Your DoorstepFilings OTP', 'register-otp', { otp });
    }

    sendWelcomeNotification(user: { email?: string | null; name?: string | null }) {
        if (!user.email) return;
        this.sendEmail(user.email, 'Welcome to DoorstepFilings!', 'welcome', {
            name: user.name ?? 'User',
            email: user.email,
        });
    }

    // ─── Staff Assignment ──────────────────────────────────────────────────────

    sendAccountantAssignmentNotification(
        accountant: { email?: string | null; name?: string | null },
        client: { name?: string | null },
    ) {
        if (!accountant.email) return;
        this.sendEmail(accountant.email, 'New Client Assigned to You', 'accountant-assigned', {
            accountantName: accountant.name ?? 'Accountant',
            clientName: client.name ?? 'Client',
            serviceName: 'Multiple Services',
            referenceId: 'N/A',
        });
    }

    sendServiceAssignmentNotification(
        accountant: { email?: string | null; name?: string | null },
        userService: { id: number; user?: { name?: string | null } | null; service?: { name?: string | null } | null },
    ) {
        if (!accountant.email) return;
        this.sendEmail(accountant.email, 'New Service Request Assigned', 'accountant-assigned', {
            accountantName: accountant.name ?? 'Accountant',
            clientName: userService.user?.name ?? 'Client',
            serviceName: userService.service?.name ?? 'Service',
            referenceId: `#${String(userService.id).padStart(6, '0')}`,
        });
    }
}
