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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../identity/infrastructure/auth/jwt-auth.guard");
const current_auth_user_decorator_1 = require("../../../identity/presentation/http/current-auth-user.decorator");
const payment_service_1 = require("../../application/payment.service");
const api_response_1 = require("../../../../shared/http/api-response");
const roles_decorator_1 = require("../../../identity/infrastructure/auth/roles.decorator");
const roles_guard_1 = require("../../../identity/infrastructure/auth/roles.guard");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async createOrder(userServiceId) {
        const order = await this.paymentService.createOrder(userServiceId);
        return (0, api_response_1.successResponse)(order);
    }
    async createLegacySingleOrder(userServiceId) {
        const order = await this.paymentService.createOrder(userServiceId);
        return (0, api_response_1.successResponse)(order);
    }
    async createCartOrder(user) {
        const order = await this.paymentService.createCartOrder(user.userId);
        return (0, api_response_1.successResponse)(order);
    }
    async createLegacyCartOrder(user) {
        const order = await this.paymentService.createCartOrder(user.userId);
        return (0, api_response_1.successResponse)(order);
    }
    async verifyPayment(payload) {
        const result = await this.paymentService.verifyPayment(payload);
        return (0, api_response_1.successResponse)(result);
    }
    async processRefund(id, reason) {
        const result = await this.paymentService.processRefund(id, reason);
        return (0, api_response_1.successResponse)(result, 'Refund processed successfully');
    }
    async downloadInvoice(user, id, res) {
        const pdfBuffer = await this.paymentService.downloadInvoice(user.userId, id);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice_${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('razorpay/create-order'),
    __param(0, (0, common_1.Body)('user_service_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('razorpay/order-single'),
    __param(0, (0, common_1.Body)('user_service_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createLegacySingleOrder", null);
__decorate([
    (0, common_1.Post)('razorpay/create-cart-order'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createCartOrder", null);
__decorate([
    (0, common_1.Post)('razorpay/order'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createLegacyCartOrder", null);
__decorate([
    (0, common_1.Post)('razorpay/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Get)('my-orders/:id/invoice'),
    __param(0, (0, current_auth_user_decorator_1.CurrentAuthUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "downloadInvoice", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map