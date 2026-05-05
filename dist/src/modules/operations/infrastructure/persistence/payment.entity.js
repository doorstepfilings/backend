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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../../identity/infrastructure/persistence/user.entity");
const user_service_entity_1 = require("./user-service.entity");
let PaymentEntity = class PaymentEntity {
    id;
    userId;
    userServiceId;
    paymentProviderOrderId;
    paymentProviderTransactionId;
    paymentProvider;
    paymentProviderStatus;
    amount;
    currency;
    status;
    paymentStatus;
    paymentMethod;
    orderUniqueId;
    invoiceUniqueId;
    notes;
    refundId;
    refundAmount;
    refundReason;
    refundStatus;
    user;
    userService;
    createdAt;
    updatedAt;
};
exports.PaymentEntity = PaymentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], PaymentEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_service_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "userServiceId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_provider_order_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "paymentProviderOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_provider_transaction_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "paymentProviderTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_provider',
        type: 'varchar',
        length: 255,
        default: 'razorpay',
    }),
    __metadata("design:type", String)
], PaymentEntity.prototype, "paymentProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_provider_status',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "paymentProviderStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PaymentEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'INR' }),
    __metadata("design:type", String)
], PaymentEntity.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'pending' }),
    __metadata("design:type", String)
], PaymentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_status', type: 'varchar', length: 50, default: 'pending' }),
    __metadata("design:type", String)
], PaymentEntity.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'order_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "orderUniqueId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'invoice_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "invoiceUniqueId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "refundId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'refund_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "refundAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "refundReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_status', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "refundStatus", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], PaymentEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_service_entity_1.UserServiceEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_service_id' }),
    __metadata("design:type", Object)
], PaymentEntity.prototype, "userService", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PaymentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PaymentEntity.prototype, "updatedAt", void 0);
exports.PaymentEntity = PaymentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'payments' })
], PaymentEntity);
//# sourceMappingURL=payment.entity.js.map