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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_service_entity_1 = require("../infrastructure/persistence/user-service.entity");
const payment_entity_1 = require("../infrastructure/persistence/payment.entity");
const unique_id_generator_1 = require("../../../shared/utils/unique-id.generator");
const notification_service_1 = require("../../communication/notification.service");
const pdf_service_1 = require("../../../shared/services/pdf.service");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
let PaymentService = class PaymentService {
    static { PaymentService_1 = this; }
    userServicesRepository;
    paymentsRepository;
    configService;
    notificationService;
    pdfService;
    razorpay;
    static GST_RATE = 0.18;
    constructor(userServicesRepository, paymentsRepository, configService, notificationService, pdfService) {
        this.userServicesRepository = userServicesRepository;
        this.paymentsRepository = paymentsRepository;
        this.configService = configService;
        this.notificationService = notificationService;
        this.pdfService = pdfService;
        this.razorpay = new razorpay_1.default({
            key_id: this.configService.getOrThrow('RAZORPAY_KEY_ID'),
            key_secret: this.configService.getOrThrow('RAZORPAY_KEY_SECRET'),
        });
    }
    async createOrder(userServiceId) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId },
            relations: { service: true, user: true },
        });
        if (!userService) {
            throw new common_1.BadRequestException('User service not found');
        }
        const totals = this.calculateTotals(userService.amount);
        const options = {
            amount: totals.amountPaise,
            currency: 'INR',
            receipt: `receipt_${userService.id}`,
            notes: {
                user_service_id: userService.id,
                service_name: userService.service?.name,
            },
        };
        try {
            const order = await this.createRazorpayOrder(options);
            const payment = this.paymentsRepository.create({
                userId: userService.userId,
                userServiceId: userService.id,
                amount: totals.grandTotal,
                paymentProviderOrderId: order.id,
                orderUniqueId: unique_id_generator_1.UniqueIDGenerator.generateOrderID(),
                invoiceUniqueId: unique_id_generator_1.UniqueIDGenerator.generateInvoiceID(),
                notes: { user_service_id: userService.id },
                status: 'pending',
                paymentStatus: 'pending',
            });
            await this.paymentsRepository.save(payment);
            return {
                amount: totals.grandTotal,
                amount_paise: totals.amountPaise,
                base_amount: totals.baseAmount,
                gst_amount: totals.gstAmount,
                grand_total: totals.grandTotal,
                invoice_unique_id: payment.invoiceUniqueId,
                is_cart: false,
                order_unique_id: payment.orderUniqueId,
                razorpay_order_id: order.id,
                currency: 'INR',
                key_id: this.configService.get('RAZORPAY_KEY_ID'),
                payment_id: payment.id,
                service_ids: [String(userService.id)],
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to create Razorpay order: ' + error.message);
        }
    }
    async createCartOrder(userId) {
        const items = await this.userServicesRepository.find({
            where: { userId, status: 'in_cart' },
            relations: { service: true },
        });
        if (items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totals = this.calculateTotals(subtotal);
        const options = {
            amount: totals.amountPaise,
            currency: 'INR',
            receipt: `cart_${userId}_${Date.now()}`,
            notes: {
                cart_item_ids: items.map((item) => item.id),
                user_id: userId,
                items_count: items.length,
            },
        };
        try {
            const order = await this.createRazorpayOrder(options);
            const payment = this.paymentsRepository.create({
                userId,
                amount: totals.grandTotal,
                paymentProviderOrderId: order.id,
                orderUniqueId: unique_id_generator_1.UniqueIDGenerator.generateOrderID(),
                invoiceUniqueId: unique_id_generator_1.UniqueIDGenerator.generateInvoiceID(),
                notes: { cart_item_ids: items.map((item) => item.id) },
                status: 'pending',
                paymentStatus: 'pending',
            });
            await this.paymentsRepository.save(payment);
            return {
                amount: totals.grandTotal,
                amount_paise: totals.amountPaise,
                base_amount: totals.baseAmount,
                gst_amount: totals.gstAmount,
                grand_total: totals.grandTotal,
                invoice_unique_id: payment.invoiceUniqueId,
                is_cart: true,
                order_unique_id: payment.orderUniqueId,
                razorpay_order_id: order.id,
                currency: 'INR',
                key_id: this.configService.get('RAZORPAY_KEY_ID'),
                payment_id: payment.id,
                service_ids: items.map((item) => String(item.id)),
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to create cart order: ' + error.message);
        }
    }
    async verifyPayment(payload) {
        const secret = this.configService.get('RAZORPAY_KEY_SECRET');
        const body = payload.razorpay_order_id + '|' + payload.razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');
        if (expectedSignature === payload.razorpay_signature) {
            const payment = await this.paymentsRepository.findOne({
                where: { id: payload.payment_id },
            });
            if (!payment) {
                throw new common_1.NotFoundException('Payment record not found');
            }
            payment.status = 'paid';
            payment.paymentStatus = 'paid';
            payment.paymentProviderTransactionId = payload.razorpay_payment_id;
            payment.paymentProviderStatus = 'captured';
            await this.paymentsRepository.save(payment);
            const cartItemIds = payment.notes?.cart_item_ids || [];
            if (payload.is_cart && cartItemIds.length > 0) {
                await this.userServicesRepository.update(cartItemIds, {
                    status: 'paid',
                    paymentStatus: 'success',
                });
            }
            else if (payment.userServiceId) {
                await this.userServicesRepository.update(payment.userServiceId, { status: 'paid', paymentStatus: 'success' });
            }
            const userService = payment.userServiceId
                ? await this.userServicesRepository.findOne({
                    where: { id: payment.userServiceId },
                    relations: { user: true, service: true },
                })
                : null;
            if (userService?.user) {
                this.notificationService.sendPaymentSuccessNotification(userService.user, payment, userService.service?.name ?? 'Service Purchase');
            }
            return {
                invoice_unique_id: payment.invoiceUniqueId,
                order_unique_id: payment.orderUniqueId,
                payment_id: payment.id,
                service_ids: this.resolvePaymentServiceIds(payment).map(String),
                success: true,
            };
        }
        else {
            throw new common_1.BadRequestException('Invalid payment signature');
        }
    }
    async processRefund(paymentId, reason) {
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId },
            relations: { userService: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status !== 'paid') {
            throw new common_1.BadRequestException('Only paid payments can be refunded');
        }
        payment.status = 'refunded';
        payment.refundStatus = 'processed';
        payment.refundReason = reason || 'Customer requested refund';
        payment.refundAmount = payment.amount;
        await this.paymentsRepository.save(payment);
        const cartItemIds = payment.notes?.cart_item_ids || [];
        if (cartItemIds.length > 0) {
            await this.userServicesRepository.update(cartItemIds, {
                status: 'refunded',
            });
        }
        else if (payment.userServiceId) {
            await this.userServicesRepository.update(payment.userServiceId, {
                status: 'refunded',
            });
        }
        const userService = payment.userServiceId
            ? await this.userServicesRepository.findOne({
                where: { id: payment.userServiceId },
                relations: { user: true },
            })
            : null;
        if (userService?.user) {
            this.notificationService.sendRefundNotification(userService.user, payment);
        }
        return payment;
    }
    calculateTotals(amount) {
        const baseAmount = Number(amount || 0);
        const gstAmount = baseAmount * PaymentService_1.GST_RATE;
        const grandTotal = Math.round(baseAmount + gstAmount);
        const amountPaise = Math.round(grandTotal * 100);
        return {
            amountPaise,
            baseAmount,
            gstAmount,
            grandTotal,
        };
    }
    createRazorpayOrder(options) {
        return this.razorpay.orders.create(options);
    }
    async myOrders(userId) {
        const payments = await this.paymentsRepository.find({
            where: { userId },
            relations: { userService: { service: true } },
            order: { createdAt: 'DESC' },
        });
        const allServiceIds = [
            ...new Set(payments.flatMap((payment) => this.resolvePaymentServiceIds(payment))),
        ];
        const relatedServices = allServiceIds.length > 0
            ? await this.userServicesRepository.find({
                where: { id: (0, typeorm_2.In)(allServiceIds) },
                relations: { service: true },
            })
            : [];
        const servicesById = new Map(relatedServices.map((service) => [service.id, service]));
        return payments.map((payment) => this.toPaymentOrderResource(payment, servicesById));
    }
    async downloadInvoice(userId, paymentId) {
        const payment = await this.paymentsRepository.findOne({
            where: { id: paymentId, userId },
            relations: { userService: { service: true }, user: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (!this.isPaymentSettled(payment)) {
            throw new common_1.BadRequestException('Invoice is available only for paid payments');
        }
        const relatedServiceIds = this.resolvePaymentServiceIds(payment);
        const relatedServices = relatedServiceIds.length > 0
            ? await this.userServicesRepository.find({
                where: { id: (0, typeorm_2.In)(relatedServiceIds) },
                relations: { service: true },
            })
            : [];
        const relatedServicesById = new Map(relatedServices.map((service) => [service.id, service]));
        const orderedServices = relatedServiceIds
            .map((serviceId) => {
            if (payment.userService &&
                payment.userService.id === serviceId &&
                payment.userService.service) {
                return payment.userService;
            }
            return relatedServicesById.get(serviceId) ?? null;
        })
            .filter((service) => service !== null);
        const services = orderedServices.length > 0
            ? orderedServices.map((service, index) => {
                const totals = this.calculateTotals(service.amount);
                return {
                    index: index + 1,
                    name: service.service?.name || 'Service',
                    plan: service.formData?.pricing_plan || '',
                    basePrice: totals.baseAmount,
                    gstAmount: totals.gstAmount,
                    totalAmount: totals.grandTotal,
                };
            })
            : [
                {
                    index: 1,
                    name: 'Service Purchase',
                    plan: '',
                    ...this.calculateTotals(payment.amount),
                },
            ].map((item) => ({
                index: item.index,
                name: item.name,
                plan: item.plan,
                basePrice: item.baseAmount,
                gstAmount: item.gstAmount,
                totalAmount: item.grandTotal,
            }));
        const baseAmount = services.reduce((acc, s) => acc + s.basePrice, 0);
        const gstAmount = services.reduce((acc, s) => acc + s.gstAmount, 0);
        const grandTotal = services.reduce((acc, s) => acc + s.totalAmount, 0);
        const context = {
            company: {
                name: 'DoorstepFilings',
                addressLine1: 'A/639, Sun WestBank',
                addressLine2: 'Nr. Shiv Cinema, Ashram Road, Navrangpura, Ahmedabad - 380009',
                email: 'support@doorstepfilings.com',
                phone: '+91 98981 96396',
                gstin: '24AAGCF9541C1ZT',
            },
            isPaid: this.isPaymentSettled(payment),
            invoiceId: payment.invoiceUniqueId,
            orderId: payment.orderUniqueId,
            date: (payment.createdAt ? new Date(payment.createdAt) : new Date()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            user: {
                name: payment.user?.name || 'Customer',
                email: payment.user?.email || '',
                phone: payment.user?.mobileNumber || '',
                address: payment.user?.address || '',
            },
            payment: {
                provider: payment.paymentProvider || 'N/A',
                providerOrderId: payment.paymentProviderOrderId || 'N/A',
                transactionId: payment.paymentProviderTransactionId || 'N/A',
                status: payment.status ? payment.status.toUpperCase() : 'UNKNOWN',
            },
            services,
            totals: {
                baseAmount,
                gstAmount,
                grandTotal,
            }
        };
        return this.pdfService.generatePdf('invoice', context);
    }
    resolvePaymentServiceIds(payment) {
        const cartItemIds = Array.isArray(payment.notes?.cart_item_ids)
            ? payment.notes.cart_item_ids
            : [];
        const serviceIds = [...cartItemIds, payment.userServiceId].filter((value) => Number.isInteger(Number(value)));
        return [...new Set(serviceIds.map((value) => Number(value)))];
    }
    isPaymentSettled(payment) {
        const normalizedStatus = String(payment.status || '').toLowerCase();
        const normalizedPaymentStatus = String(payment.paymentStatus || '').toLowerCase();
        return (normalizedStatus === 'paid' ||
            normalizedPaymentStatus === 'paid' ||
            normalizedPaymentStatus === 'success');
    }
    toPaymentOrderResource(payment, servicesById) {
        const services = this.resolvePaymentServiceIds(payment)
            .map((serviceId) => {
            if (payment.userService &&
                payment.userService.id === serviceId &&
                payment.userService.service) {
                return payment.userService;
            }
            return servicesById.get(serviceId) ?? null;
        })
            .filter((service) => service !== null);
        const subtotalFromServices = services.reduce((sum, service) => sum + Number(service.amount || 0), 0);
        const amount = Number(payment.amount || 0);
        const subtotal = Number((subtotalFromServices > 0
            ? subtotalFromServices
            : amount / (1 + PaymentService_1.GST_RATE)).toFixed(2));
        const gstAmount = Number((amount - subtotal).toFixed(2));
        return {
            amount,
            created_at: payment.createdAt,
            currency: payment.currency,
            gst_amount: gstAmount,
            id: payment.id,
            invoice_unique_id: payment.invoiceUniqueId,
            items: services.map((service) => ({
                application_unique_id: service.applicationUniqueId,
                id: service.id,
                name: service.service?.name || 'Service',
                price: Number(service.amount || service.service?.price || 0),
                service_id: service.serviceId,
                status: service.status,
            })),
            order_unique_id: payment.orderUniqueId,
            payment_provider: payment.paymentProvider,
            payment_provider_order_id: payment.paymentProviderOrderId,
            payment_provider_transaction_id: payment.paymentProviderTransactionId,
            payment_status: payment.paymentStatus,
            status: payment.status,
            subtotal,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notification_service_1.NotificationService,
        pdf_service_1.PdfService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map