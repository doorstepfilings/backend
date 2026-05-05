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
exports.ServiceRequestDocumentEntity = void 0;
const typeorm_1 = require("typeorm");
const user_service_entity_1 = require("./user-service.entity");
const user_entity_1 = require("../../../identity/infrastructure/persistence/user.entity");
let ServiceRequestDocumentEntity = class ServiceRequestDocumentEntity {
    id;
    userServiceId;
    serviceDocumentId;
    uploadedById;
    sourceDocumentId;
    documentName;
    documentType;
    documentCategory;
    fileName;
    filePath;
    fileExtension;
    fileSize;
    mimeType;
    version;
    status;
    notes;
    isFinal;
    userService;
    uploadedBy;
    createdAt;
    updatedAt;
    get fileUrl() {
        return `/storage/${this.filePath}`;
    }
};
exports.ServiceRequestDocumentEntity = ServiceRequestDocumentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceRequestDocumentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_service_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceRequestDocumentEntity.prototype, "userServiceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_document_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "serviceDocumentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceRequestDocumentEntity.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_document_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "sourceDocumentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'document_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "documentName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'document_type',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'document_category',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "documentCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ServiceRequestDocumentEntity.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ServiceRequestDocumentEntity.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'file_extension',
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "fileExtension", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], ServiceRequestDocumentEntity.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ServiceRequestDocumentEntity.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'version', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ServiceRequestDocumentEntity.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 50, default: 'pending' }),
    __metadata("design:type", String)
], ServiceRequestDocumentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceRequestDocumentEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_final', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ServiceRequestDocumentEntity.prototype, "isFinal", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_service_entity_1.UserServiceEntity, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_service_id' }),
    __metadata("design:type", user_service_entity_1.UserServiceEntity)
], ServiceRequestDocumentEntity.prototype, "userService", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_1.UserEntity)
], ServiceRequestDocumentEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ServiceRequestDocumentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ServiceRequestDocumentEntity.prototype, "updatedAt", void 0);
exports.ServiceRequestDocumentEntity = ServiceRequestDocumentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_request_documents' })
], ServiceRequestDocumentEntity);
//# sourceMappingURL=service-request-document.entity.js.map