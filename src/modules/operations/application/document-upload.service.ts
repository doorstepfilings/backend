import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequestDocumentEntity } from '../infrastructure/persistence/service-request-document.entity';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
import * as fs from 'fs';
import * as path from 'path';

export type UploadedDocumentFile = {
    buffer: Buffer;
    documentCategory?: string;
    documentType?: string;
    isFinal?: boolean;
    mimetype: string;
    notes?: string;
    originalname: string;
    serviceDocumentId?: number;
    size: number;
    sourceDocumentId?: number;
    type?: string;
};

@Injectable()
export class DocumentUploadService {
    private readonly uploadRoot = path.resolve(process.cwd(), 'public/storage');

    constructor(
        @InjectRepository(ServiceRequestDocumentEntity)
        private readonly documentsRepository: Repository<ServiceRequestDocumentEntity>,
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
    ) {
        if (!fs.existsSync(this.uploadRoot)) {
            fs.mkdirSync(this.uploadRoot, { recursive: true });
        }
    }

    async uploadDocuments(
        userServiceId: number,
        userId: number,
        files: UploadedDocumentFile[],
    ) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId },
        });

        if (!userService) {
            throw new BadRequestException('User service not found');
        }

        const uploadedDocs: ServiceRequestDocumentEntity[] = [];

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
            const version = await this.resolveNextVersion(
                userServiceId,
                documentName,
            );

            fs.writeFileSync(fullPath, file.buffer);

            const doc = this.documentsRepository.create({
                documentCategory:
                    documentType === 'client'
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
                isFinal:
                    documentType === 'client' ? Boolean(file.isFinal) : false,
                mimeType: file.mimetype,
                notes: file.notes ?? null,
                status:
                    documentType === 'client' && file.isFinal
                        ? 'approved'
                        : 'pending',
                version,
            });

            uploadedDocs.push(await this.documentsRepository.save(doc));
        }

        // Update the JSON documents field in user_service for backward compatibility/easy access
        const currentDocs =
            (userService.documents as Record<string, string>) || {};
        uploadedDocs.forEach((doc) => {
            const key = doc.documentName || doc.documentType || doc.fileName;
            currentDocs[key] = doc.filePath;
        });
        userService.documents = currentDocs;
        await this.userServicesRepository.save(userService);

        return uploadedDocs;
    }

    async deleteDocument(docId: number, userId: number) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId, uploadedById: userId },
        });

        if (!doc) {
            throw new BadRequestException(
                'Document not found or access denied',
            );
        }

        return this.deleteDocumentRecord(doc);
    }

    async deleteDocumentById(docId: number) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId },
        });

        if (!doc) {
            throw new BadRequestException('Document not found');
        }

        return this.deleteDocumentRecord(doc);
    }

    private resolveDocumentType(documentType?: string | null) {
        return documentType === 'internal' ||
            documentType === 'internal_document'
            ? 'internal'
            : 'client';
    }

    private async resolveNextVersion(
        userServiceId: number,
        documentName: string | null,
    ) {
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
            .getRawOne<{ version: number | string | null }>();

        return Number(existing?.version ?? 0) + 1;
    }

    private async deleteDocumentRecord(doc: ServiceRequestDocumentEntity) {
        const fullPath = path.join(this.uploadRoot, ...doc.filePath.split('/'));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        const userService = await this.userServicesRepository.findOne({
            where: { id: doc.userServiceId },
        });

        await this.documentsRepository.delete(doc.id);

        if (userService?.documents) {
            const entries = Object.entries(userService.documents).filter(
                ([, filePath]) => filePath !== doc.filePath,
            );
            userService.documents = Object.fromEntries(entries);
            await this.userServicesRepository.save(userService);
        }

        return true;
    }
}
