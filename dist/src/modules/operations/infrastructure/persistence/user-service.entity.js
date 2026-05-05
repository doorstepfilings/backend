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
exports.UserServiceEntity = void 0;
const typeorm_1 = require("typeorm");
const service_entity_1 = require("../../../catalog/infrastructure/persistence/service.entity");
const user_entity_1 = require("../../../identity/infrastructure/persistence/user.entity");
const service_request_document_entity_1 = require("./service-request-document.entity");
const payment_entity_1 = require("./payment.entity");
let UserServiceEntity = class UserServiceEntity {
    id;
    userId;
    serviceId;
    accountantId;
    applicationUniqueId;
    status;
    paymentStatus;
    formData;
    documents;
    amount;
    notes;
    revisionNotes;
    caNotes;
    updateNote;
    rejectionReason;
    verified;
    certificateUrl;
    submittedToCaAt;
    user;
    accountant;
    service;
    requestDocuments;
    payments;
    createdAt;
    updatedAt;
};
exports.UserServiceEntity = UserServiceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserServiceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'bigint' }),
    __metadata("design:type", Number)
], UserServiceEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_id', type: 'bigint' }),
    __metadata("design:type", Number)
], UserServiceEntity.prototype, "serviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'accountant_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "accountantId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'application_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "applicationUniqueId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 255, default: 'draft' }),
    __metadata("design:type", String)
], UserServiceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_status',
        type: 'varchar',
        length: 255,
        default: 'pending',
    }),
    __metadata("design:type", String)
], UserServiceEntity.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'form_data', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "formData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'documents', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'revision_notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "revisionNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ca_notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "caNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'update_note', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "updateNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rejection_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserServiceEntity.prototype, "verified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'certificate_url',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "certificateUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'submitted_to_ca_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "submittedToCaAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], UserServiceEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'accountant_id' }),
    __metadata("design:type", Object)
], UserServiceEntity.prototype, "accountant", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_entity_1.ServiceEntity, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_entity_1.ServiceEntity)
], UserServiceEntity.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_request_document_entity_1.ServiceRequestDocumentEntity, (document) => document.userService),
    __metadata("design:type", Array)
], UserServiceEntity.prototype, "requestDocuments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.PaymentEntity, (payment) => payment.userService),
    __metadata("design:type", Array)
], UserServiceEntity.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserServiceEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], UserServiceEntity.prototype, "updatedAt", void 0);
exports.UserServiceEntity = UserServiceEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_services' })
], UserServiceEntity);
//# sourceMappingURL=user-service.entity.js.map