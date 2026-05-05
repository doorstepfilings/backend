"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const config_1 = require("@nestjs/config");
const twilio_1 = require("twilio");
let NotificationService = NotificationService_1 = class NotificationService {
    mailerService;
    configService;
    logger = new common_1.Logger(NotificationService_1.name);
    twilioClient = null;
    constructor(mailerService, configService) {
        this.mailerService = mailerService;
        this.configService = configService;
        const twilioConfig = this.configService.get('app.twilio');
        if (twilioConfig?.sid && twilioConfig?.token) {
            this.twilioClient = new twilio_1.Twilio(twilioConfig.sid, twilioConfig.token);
        }
    }
    get dashboardUrl() {
        const frontendUrl = this.configService.get('app.frontendUrl', 'http://localhost:3000');
        return `${frontendUrl}/dashboard`;
    }
    get year() {
        return new Date().getFullYear();
    }
    async sendEmail(to, subject, template, context) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                template: `./${template}`,
                context: { ...context, year: this.year, dashboardUrl: this.dashboardUrl },
            });
            this.logger.log(`Email sent to ${to} [${template}]`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        }
    }
    async sendSms(to, body) {
        if (!this.twilioClient) {
            this.logger.warn('Twilio client not initialized. Skipping SMS.');
            return;
        }
        const twilioConfig = this.configService.getOrThrow('app.twilio');
        try {
            const formattedTo = to.startsWith('+') ? to : `+${to}`;
            await this.twilioClient.messages.create({
                body,
                from: twilioConfig.number,
                to: formattedTo,
            });
            this.logger.log(`SMS sent to ${formattedTo}`);
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
        }
    }
    sendServiceAppliedNotification(user, service) {
        if (!user.email)
            return;
        this.sendEmail(user.email, 'Service Application Received', 'service-applied', {
            userName: user.name ?? 'User',
            serviceName: service.name ?? 'Service',
            referenceId: `#${String(user.id ?? 0).padStart(6, '0')}`,
        });
    }
    sendServiceFinalizedNotification(user, userService) {
        if (!user.email)
            return;
        this.sendEmail(user.email, 'Your Service Has Been Completed', 'service-finalized', {
            userName: user.name ?? 'User',
            serviceName: userService.service?.name ?? 'Service',
            referenceId: `#${String(userService.id).padStart(6, '0')}`,
            certificateUrl: userService.certificateUrl ?? null,
        });
    }
    sendPaymentSuccessNotification(user, payment, serviceName = 'Service Purchase') {
        if (!user.email)
            return;
        this.sendEmail(user.email, 'Payment Successful - DoorstepFilings', 'payment-success', {
            userName: user.name ?? 'User',
            amount: payment.amount.toFixed(2),
            orderUniqueId: payment.orderUniqueId ?? 'N/A',
            serviceName,
        });
    }
    sendRefundNotification(user, payment) {
        if (!user.email)
            return;
        this.sendEmail(user.email, 'Refund Initiated - DoorstepFilings', 'refund', {
            userName: user.name ?? 'User',
            refundAmount: (payment.refundAmount ?? 0).toFixed(2),
            orderUniqueId: payment.orderUniqueId ?? 'N/A',
            refundReason: payment.refundReason ?? 'Customer request',
        });
    }
    sendRegisterOtpNotification(to, otp) {
        this.sendEmail(to, 'Your DoorstepFilings OTP', 'register-otp', { otp });
    }
    sendWelcomeNotification(user) {
        if (!user.email)
            return;
        this.sendEmail(user.email, 'Welcome to DoorstepFilings!', 'welcome', {
            name: user.name ?? 'User',
            email: user.email,
        });
    }
    sendAccountantAssignmentNotification(accountant, client) {
        if (!accountant.email)
            return;
        this.sendEmail(accountant.email, 'New Client Assigned to You', 'accountant-assigned', {
            accountantName: accountant.name ?? 'Accountant',
            clientName: client.name ?? 'Client',
            serviceName: 'Multiple Services',
            referenceId: 'N/A',
        });
    }
    sendServiceAssignmentNotification(accountant, userService) {
        if (!accountant.email)
            return;
        this.sendEmail(accountant.email, 'New Service Request Assigned', 'accountant-assigned', {
            accountantName: accountant.name ?? 'Accountant',
            clientName: userService.user?.name ?? 'Client',
            serviceName: userService.service?.name ?? 'Service',
            referenceId: `#${String(userService.id).padStart(6, '0')}`,
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map