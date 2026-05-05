import { UserServiceEntity } from './user-service.entity';
import { UserEntity } from '../../../identity/infrastructure/persistence/user.entity';
export declare class ServiceRequestDocumentEntity {
    id: number;
    userServiceId: number;
    serviceDocumentId: number | null;
    uploadedById: number;
    sourceDocumentId: number | null;
    documentName: string | null;
    documentType: string | null;
    documentCategory: string | null;
    fileName: string;
    filePath: string;
    fileExtension: string | null;
    fileSize: number;
    mimeType: string;
    version: number;
    status: string;
    notes: string | null;
    isFinal: boolean;
    userService: UserServiceEntity;
    uploadedBy: UserEntity;
    createdAt: Date;
    updatedAt: Date;
    get fileUrl(): string;
}
