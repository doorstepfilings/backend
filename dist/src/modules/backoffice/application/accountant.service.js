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
exports.AccountantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../identity/infrastructure/persistence/user.entity");
const user_service_entity_1 = require("../../operations/infrastructure/persistence/user-service.entity");
const identity_mapper_1 = require("../../identity/application/identity.mapper");
const operations_mapper_1 = require("../../operations/application/operations.mapper");
const user_services_service_1 = require("../../operations/application/user-services.service");
const service_request_document_entity_1 = require("../../operations/infrastructure/persistence/service-request-document.entity");
const document_upload_service_1 = require("../../operations/application/document-upload.service");
let AccountantService = class AccountantService {
    usersRepository;
    userServicesRepository;
    documentsRepository;
    userServicesService;
    documentUploadService;
    constructor(usersRepository, userServicesRepository, documentsRepository, userServicesService, documentUploadService) {
        this.usersRepository = usersRepository;
        this.userServicesRepository = userServicesRepository;
        this.documentsRepository = documentsRepository;
        this.userServicesService = userServicesService;
        this.documentUploadService = documentUploadService;
    }
    async getAssignedUsers(accountantId) {
        const users = await this.usersRepository.find({
            where: { accountantId, role: 'user' },
            relations: { regionalManager: true },
            order: { name: 'ASC' },
        });
        return users.map(identity_mapper_1.toUserResource);
    }
    async listRequests(accountantId, status) {
        const where = { accountantId, status: (0, typeorm_2.Not)('in_cart') };
        if (status)
            where.status = status;
        const requests = await this.userServicesRepository.find({
            where,
            relations: {
                user: true,
                service: { category: true },
                requestDocuments: { uploadedBy: true },
            },
            order: { updatedAt: 'DESC' },
        });
        return requests.map((request) => (0, operations_mapper_1.toUserServiceResource)(request));
    }
    async showRequest(accountantId, id) {
        const request = await this.userServicesRepository.findOne({
            where: { id, accountantId },
            relations: {
                user: true,
                service: { category: true },
                requestDocuments: { uploadedBy: true },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('Service request not found');
        return (0, operations_mapper_1.toUserServiceResource)(request);
    }
    async updateStatus(accountantId, id, data) {
        await this.userServicesRepository.findOneOrFail({
            where: { id, accountantId },
        });
        return this.userServicesService.updateApplicationStatus(id, data);
    }
    async verifyDocument(accountantId, userServiceId, docId, status, notes) {
        await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId, accountantId },
        });
        return this.userServicesService.verifyDocument(userServiceId, docId, status, notes);
    }
    async listDocuments(accountantId, requestId) {
        await this.showRequest(accountantId, requestId);
        return this.documentsRepository.find({
            where: { userServiceId: requestId },
            relations: { uploadedBy: true },
            order: { createdAt: 'DESC' },
        });
    }
    async deleteDocument(accountantId, docId) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId },
            relations: { userService: true },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (doc.userService.accountantId != accountantId) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        await this.documentUploadService.deleteDocumentById(docId);
        return true;
    }
    async uploadDocuments(accountantId, requestId, files) {
        const request = await this.userServicesRepository.findOne({
            where: { id: requestId, accountantId },
        });
        if (!request) {
            throw new common_1.NotFoundException('Service request not found');
        }
        if (['approved', 'cancelled', 'completed', 'rejected'].includes(request.status)) {
            throw new common_1.BadRequestException(`Documents cannot be uploaded while the request is in '${request.status}' status.`);
        }
        await this.documentUploadService.uploadDocuments(requestId, accountantId, files);
        return this.showRequest(accountantId, requestId);
    }
    async deleteDocumentFromRequest(accountantId, requestId, docId) {
        const request = await this.userServicesRepository.findOne({
            where: { id: requestId, accountantId },
        });
        if (!request) {
            throw new common_1.NotFoundException('Service request not found');
        }
        const document = await this.documentsRepository.findOne({
            where: { id: docId, userServiceId: requestId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        await this.documentUploadService.deleteDocumentById(docId);
        return true;
    }
    async submitRevision(accountantId, requestId, notes) {
        const trimmedNotes = notes.trim();
        if (!trimmedNotes) {
            throw new common_1.BadRequestException('Revision notes are required');
        }
        const request = await this.userServicesRepository.findOne({
            where: { id: requestId, accountantId },
        });
        if (!request) {
            throw new common_1.NotFoundException('Service request not found');
        }
        if (request.status !== 'update_required') {
            throw new common_1.BadRequestException('Revisions can only be submitted for requests awaiting updates.');
        }
        await this.userServicesService.updateApplicationStatus(requestId, {
            status: 'under_review',
        });
        await this.userServicesRepository.update({ id: requestId, accountantId }, {
            revisionNotes: trimmedNotes,
            updateNote: null,
        });
        return this.showRequest(accountantId, requestId);
    }
};
exports.AccountantService = AccountantService;
exports.AccountantService = AccountantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(service_request_document_entity_1.ServiceRequestDocumentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_services_service_1.UserServicesService,
        document_upload_service_1.DocumentUploadService])
], AccountantService);
//# sourceMappingURL=accountant.service.js.map