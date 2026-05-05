import { Repository } from 'typeorm';
import { ServiceRequestDocumentEntity } from '../infrastructure/persistence/service-request-document.entity';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
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
export declare class DocumentUploadService {
    private readonly documentsRepository;
    private readonly userServicesRepository;
    private readonly uploadRoot;
    constructor(documentsRepository: Repository<ServiceRequestDocumentEntity>, userServicesRepository: Repository<UserServiceEntity>);
    uploadDocuments(userServiceId: number, userId: number, files: UploadedDocumentFile[]): Promise<ServiceRequestDocumentEntity[]>;
    deleteDocument(docId: number, userId: number): Promise<boolean>;
    deleteDocumentById(docId: number): Promise<boolean>;
    private resolveDocumentType;
    private resolveNextVersion;
    private deleteDocumentRecord;
}
