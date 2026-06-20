import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export type UploadedDocumentFile = {
    buffer: Buffer;
    documentCategory?: string;
    documentType?: string;
    isFinal?: boolean;
    fieldname?: string;
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
        private readonly prisma: PrismaService,
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
        const userService = await this.prisma.userService.findUnique({
            where: { id: userServiceId },
        });

        if (!userService) {
            throw new BadRequestException('User service not found');
        }

        const uploadedDocs: any[] = [];

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

            const doc = await this.prisma.serviceRequestDocument.create({
                data: {
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
                    fileSize: BigInt(file.size),
                    isFinal:
                        documentType === 'client' ? Boolean(file.isFinal) : false,
                    mimeType: file.mimetype,
                    notes: file.notes ?? null,
                    status:
                        documentType === 'client' && file.isFinal
                            ? 'approved'
                            : 'pending',
                    version,
                }
            });

            uploadedDocs.push(doc);
        }

        // Update the JSON documents field in user_service for backward compatibility/easy access
        const currentDocs =
            (userService.documents as Record<string, string>) || {};
        uploadedDocs.forEach((doc) => {
            const key = doc.documentName || doc.documentType || doc.fileName;
            currentDocs[key] = doc.filePath;
        });

        await this.prisma.userService.update({
            where: { id: userService.id },
            data: { documents: currentDocs as any }
        });

        return uploadedDocs;
    }

    async deleteDocument(docId: number, userId: number) {
        const doc = await this.prisma.serviceRequestDocument.findFirst({
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
        const doc = await this.prisma.serviceRequestDocument.findUnique({
            where: { id: docId },
        });

        if (!doc) {
            throw new BadRequestException('Document not found');
        }

        return this.deleteDocumentRecord(doc);
    }

    async replaceDocument(
        docId: number,
        uploadedById: number,
        file: UploadedDocumentFile,
        notes?: string,
    ) {
        const document = await this.prisma.serviceRequestDocument.findUnique({
            where: { id: docId },
        });

        if (!document) {
            throw new BadRequestException('Document not found');
        }

        const folder = `service_documents/${uploadedById}/${document.userServiceId}`;
        const fullFolder = path.join(this.uploadRoot, folder);
        if (!fs.existsSync(fullFolder)) {
            fs.mkdirSync(fullFolder, { recursive: true });
        }

        const extension = path.extname(file.originalname).replace('.', '');
        const storedFileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.posix.join(folder, storedFileName);
        const fullPath = path.join(this.uploadRoot, ...filePath.split('/'));

        fs.writeFileSync(fullPath, file.buffer);

        try {
            const updated = await this.prisma.serviceRequestDocument.update({
                where: { id: document.id },
                data: {
                    uploadedById,
                    fileName: file.originalname,
                    filePath,
                    fileExtension: extension || null,
                    fileSize: BigInt(file.size),
                    mimeType: file.mimetype,
                    notes: notes ?? document.notes,
                    sourceDocumentId: null,
                    status: 'pending',
                    version: document.version + 1,
                },
            });

            if (document.filePath !== filePath) {
                this.deletePhysicalFile(document.filePath);
            }

            if (document.userServiceId) {
                const userService = await this.prisma.userService.findUnique({
                    where: { id: document.userServiceId },
                });

                if (userService?.documents) {
                    const currentDocs = userService.documents as Record<
                        string,
                        string
                    >;
                    const entries = Object.entries(currentDocs).map(
                        ([key, value]) => [
                            key,
                            value === document.filePath ? filePath : value,
                        ],
                    );

                    await this.prisma.userService.update({
                        where: { id: document.userServiceId },
                        data: {
                            documents: Object.fromEntries(entries) as any,
                        },
                    });
                }
            }

            return updated;
        } catch (error) {
            this.deletePhysicalFile(filePath);
            throw error;
        }
    }

    private resolveDocumentType(documentType?: string | null) {
        if (!documentType) {
            return 'client';
        }

        const normalized = documentType.trim().toLowerCase();

        if (
            normalized === 'internal' ||
            normalized === 'internal_only' ||
            normalized === 'internal_document'
        ) {
            return 'internal';
        }

        return 'client';
    }

    private async resolveNextVersion(
        userServiceId: number,
        documentName: string | null,
    ) {
        if (!documentName) {
            return 1;
        }

        const existing = await this.prisma.serviceRequestDocument.aggregate({
            where: {
                userServiceId,
                documentName,
            },
            _max: {
                version: true,
            },
        });

        return (existing._max.version ?? 0) + 1;
    }

    deletePhysicalFile(filePath: string) {
        try {
            const fullPath = path.join(this.uploadRoot, ...filePath.split('/'));
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (error) {
            console.error(`Failed to delete physical file: ${filePath}`, error);
        }
    }

    private async deleteDocumentRecord(doc: any) {
        const fullPath = path.join(this.uploadRoot, ...doc.filePath.split('/'));
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (error) {
                console.error(`Failed to delete file from disk: ${fullPath}`, error);
            }
        }

        const userService = await this.prisma.userService.findUnique({
            where: { id: doc.userServiceId },
        });

        await this.prisma.serviceRequestDocument.delete({
            where: { id: doc.id }
        });

        if (userService?.documents) {
            const currentDocs = userService.documents as Record<string, string>;
            const entries = Object.entries(currentDocs).filter(
                ([, filePath]) => filePath !== doc.filePath,
            );
            
            await this.prisma.userService.update({
                where: { id: userService.id },
                data: { documents: Object.fromEntries(entries) as any }
            });
        }

        return true;
    }
}
