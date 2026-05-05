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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_request_document_entity_1 = require("../infrastructure/persistence/service-request-document.entity");
const user_service_entity_1 = require("../infrastructure/persistence/user-service.entity");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let DocumentUploadService = class DocumentUploadService {
    documentsRepository;
    userServicesRepository;
    uploadRoot = path.resolve(process.cwd(), 'public/storage');
    constructor(documentsRepository, userServicesRepository) {
        this.documentsRepository = documentsRepository;
        this.userServicesRepository = userServicesRepository;
        if (!fs.existsSync(this.uploadRoot)) {
            fs.mkdirSync(this.uploadRoot, { recursive: true });
        }
    }
    async uploadDocuments(userServiceId, userId, files) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId },
        });
        if (!userService) {
            throw new common_1.BadRequestException('User service not found');
        }
        const uploadedDocs = [];
        for (const file of files) {
            const folder = `service_documents/${userId}/${userServiceId}`;
            const fullFolder = path.join(this.uploadRoot, folder);
            if (!fs.existsSync(fullFolder)) {
                fs.mkdirSync(fullFolder, { recursive: true });
            }
            const extension = path.extname(file.originalname).replace('.', '');
            const fileName = `${Date.now()}_${file.originalname}`;
            const filePath = path.posix.join(folder, fileName);
            const fullPath = path.join(this.uploadRoot, ...filePath.split('/'));
            const documentName = file.type?.trim() || null;
            const documentType = this.resolveDocumentType(file.documentType);
            const version = await this.resolveNextVersion(userServiceId, documentName);
            fs.writeFileSync(fullPath, file.buffer);
            const doc = this.documentsRepository.create({
                documentCategory: documentType === 'client'
                    ? (file.documentCategory ?? null)
                    : null,
                documentName,
                userServiceId,
                uploadedById: userId,
                serviceDocumentId: file.serviceDocumentId ?? null,
                sourceDocumentId: file.sourceDocumentId ?? null,
                documentType,
                fileName: file.originalname,
                filePath,
                fileExtension: extension || null,
                fileSize: file.size,
                isFinal: documentType === 'client' ? Boolean(file.isFinal) : false,
                mimeType: file.mimetype,
                notes: file.notes ?? null,
                status: documentType === 'client' && file.isFinal
                    ? 'approved'
                    : 'pending',
                version,
            });
            uploadedDocs.push(await this.documentsRepository.save(doc));
        }
        const currentDocs = userService.documents || {};
        uploadedDocs.forEach((doc) => {
            const key = doc.documentName || doc.documentType || doc.fileName;
            currentDocs[key] = doc.filePath;
        });
        userService.documents = currentDocs;
        await this.userServicesRepository.save(userService);
        return uploadedDocs;
    }
    async deleteDocument(docId, userId) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId, uploadedById: userId },
        });
        if (!doc) {
            throw new common_1.BadRequestException('Document not found or access denied');
        }
        return this.deleteDocumentRecord(doc);
    }
    async deleteDocumentById(docId) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId },
        });
        if (!doc) {
            throw new common_1.BadRequestException('Document not found');
        }
        return this.deleteDocumentRecord(doc);
    }
    resolveDocumentType(documentType) {
        return documentType === 'internal' ||
            documentType === 'internal_document'
            ? 'internal'
            : 'client';
    }
    async resolveNextVersion(userServiceId, documentName) {
        if (!documentName) {
            return 1;
        }
        const existing = await this.documentsRepository
            .createQueryBuilder('document')
            .select('MAX(document.version)', 'version')
            .where('document.user_service_id = :userServiceId', {
            userServiceId,
        })
            .andWhere('document.document_name = :documentName', {
            documentName,
        })
            .getRawOne();
        return Number(existing?.version ?? 0) + 1;
    }
    async deleteDocumentRecord(doc) {
        const fullPath = path.join(this.uploadRoot, ...doc.filePath.split('/'));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        const userService = await this.userServicesRepository.findOne({
            where: { id: doc.userServiceId },
        });
        await this.documentsRepository.delete(doc.id);
        if (userService?.documents) {
            const entries = Object.entries(userService.documents).filter(([, filePath]) => filePath !== doc.filePath);
            userService.documents = Object.fromEntries(entries);
            await this.userServicesRepository.save(userService);
        }
        return true;
    }
};
exports.DocumentUploadService = DocumentUploadService;
exports.DocumentUploadService = DocumentUploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_request_document_entity_1.ServiceRequestDocumentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DocumentUploadService);
//# sourceMappingURL=document-upload.service.js.map