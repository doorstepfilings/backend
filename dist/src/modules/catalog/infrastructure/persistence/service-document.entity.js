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
exports.ServiceDocumentEntity = void 0;
const typeorm_1 = require("typeorm");
const service_entity_1 = require("./service.entity");
let ServiceDocumentEntity = class ServiceDocumentEntity {
    id;
    serviceId;
    documentName;
    name;
    slug;
    description;
    documentType;
    fileType;
    maxSize;
    isRequired;
    sortOrder;
    metadata;
    service;
};
exports.ServiceDocumentEntity = ServiceDocumentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceDocumentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceDocumentEntity.prototype, "serviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'document_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceDocumentEntity.prototype, "documentName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ServiceDocumentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'slug', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ServiceDocumentEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceDocumentEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'document_type',
        type: 'varchar',
        length: 255,
        default: 'required',
    }),
    __metadata("design:type", String)
], ServiceDocumentEntity.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', type: 'varchar', length: 255, default: 'pdf' }),
    __metadata("design:type", String)
], ServiceDocumentEntity.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_size', type: 'int', default: 5 }),
    __metadata("design:type", Number)
], ServiceDocumentEntity.prototype, "maxSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_required', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ServiceDocumentEntity.prototype, "isRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ServiceDocumentEntity.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceDocumentEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_entity_1.ServiceEntity, (service) => service.documents, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_entity_1.ServiceEntity)
], ServiceDocumentEntity.prototype, "service", void 0);
exports.ServiceDocumentEntity = ServiceDocumentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_documents' })
], ServiceDocumentEntity);
//# sourceMappingURL=service-document.entity.js.map