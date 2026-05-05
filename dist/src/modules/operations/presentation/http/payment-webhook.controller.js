"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentWebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../../application/payment.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../../infrastructure/persistence/payment.entity");
const user_service_entity_1 = require("../../infrastructure/persistence/user-service.entity");
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
let PaymentWebhookController = PaymentWebhookController_1 = class PaymentWebhookController {
    paymentService;
    configService;
    paymentsRepository;
    userServicesRepository;
    logger = new common_1.Logger(PaymentWebhookController_1.name);
    constructor(paymentService, configService, paymentsRepository, userServicesRepository) {
        this.paymentService = paymentService;
        this.configService = configService;
        this.paymentsRepository = paymentsRepository;
        this.userServicesRepository = userServicesRepository;
    }
    async handleWebhook(body, signature) {
        const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
        if (secret) {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(body))
                .digest('hex');
            if (signature !== expectedSignature) {
                throw new common_1.BadRequestException('Invalid webhook signature');
            }
        }
        const event = body?.event;
        this.logger.log(`Razorpay webhook received: ${event}`);
        if (event === 'payment.captured') {
            const paymentEntity = body?.payload?.payment?.entity;
            const razorpayOrderId = paymentEntity?.order_id;
            const razorpayPaymentId = paymentEntity?.id;
            if (razorpayOrderId) {
                const payment = await this.paymentsRepository.findOne({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });
                if (payment && payment.status !== 'paid') {
                    payment.status = 'paid';
                    payment.paymentStatus = 'paid';
                    payment.paymentProviderTransactionId = razorpayPaymentId;
                    payment.paymentProviderStatus = 'captured';
                    await this.paymentsRepository.save(payment);
                    const cartItemIds = payment.notes?.cart_item_ids;
                    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
                        await this.userServicesRepository.update(cartItemIds, { status: 'paid', paymentStatus: 'success' });
                    }
                    else if (payment.userServiceId) {
                        await this.userServicesRepository.update(payment.userServiceId, { status: 'paid', paymentStatus: 'success' });
                    }
                    this.logger.log(`Payment captured via webhook: ${razorpayPaymentId} → order ${razorpayOrderId}`);
                }
            }
        }
        if (event === 'refund.processed') {
            const refundEntity = body?.payload?.refund?.entity;
            const razorpayOrderId = refundEntity?.payment_id;
            if (razorpayOrderId) {
                const payment = await this.paymentsRepository.findOne({
                    where: { paymentProviderOrderId: razorpayOrderId },
                });
                if (payment) {
                    payment.refundStatus = 'processed';
                    payment.refundId = refundEntity?.id;
                    await this.paymentsRepository.save(payment);
                    this.logger.log(`Refund processed via webhook: ${refundEntity?.id}`);
                }
            }
        }
        return { status: 'ok' };
    }
};
exports.PaymentWebhookController = PaymentWebhookController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-razorpay-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentWebhookController.prototype, "handleWebhook", null);
exports.PaymentWebhookController = PaymentWebhookController = PaymentWebhookController_1 = __decorate([
    (0, common_1.Controller)('payments/razorpay'),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentWebhookController);
//# sourceMappingURL=payment-webhook.controller.js.map