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
exports.ServiceEntity = void 0;
const typeorm_1 = require("typeorm");
const service_category_entity_1 = require("./service-category.entity");
const service_document_entity_1 = require("./service-document.entity");
let ServiceEntity = class ServiceEntity {
    id;
    serviceCategoryId;
    name;
    shortDescription;
    slug;
    link;
    description;
    longDescription;
    features;
    requirements;
    process;
    price;
    pricingPlans;
    gstPercentage;
    serviceCode;
    serviceType;
    processingDays;
    isActive;
    isPopular;
    isFeatured;
    metadata;
    faqs;
    requiredDocumentsList;
    extraDocuments;
    adminNotes;
    category;
    documents;
};
exports.ServiceEntity = ServiceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_category_id', type: 'bigint' }),
    __metadata("design:type", Number)
], ServiceEntity.prototype, "serviceCategoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ServiceEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'short_description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "shortDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ServiceEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "link", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'long_description', type: 'longtext', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "longDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "process", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pricing_plans', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "pricingPlans", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'gst_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 18,
    }),
    __metadata("design:type", String)
], ServiceEntity.prototype, "gstPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'service_code',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "serviceCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'service_type',
        type: 'varchar',
        length: 255,
        default: 'standard',
    }),
    __metadata("design:type", String)
], ServiceEntity.prototype, "serviceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processing_days', type: 'int', default: 7 }),
    __metadata("design:type", Number)
], ServiceEntity.prototype, "processingDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ServiceEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_popular', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ServiceEntity.prototype, "isPopular", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_featured', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ServiceEntity.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'faqs', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "faqs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'required_documents_list', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "requiredDocumentsList", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra_documents', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "extraDocuments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ServiceEntity.prototype, "adminNotes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_category_entity_1.ServiceCategoryEntity, (category) => category.services, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'service_category_id' }),
    __metadata("design:type", service_category_entity_1.ServiceCategoryEntity)
], ServiceEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => service_document_entity_1.ServiceDocumentEntity, (document) => document.service),
    __metadata("design:type", Array)
], ServiceEntity.prototype, "documents", void 0);
exports.ServiceEntity = ServiceEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'services' })
], ServiceEntity);
//# sourceMappingURL=service.entity.js.map