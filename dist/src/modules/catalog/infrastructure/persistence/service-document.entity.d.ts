import { ServiceEntity } from './service.entity';
export declare class ServiceDocumentEntity {
    id: number;
    serviceId: number;
    documentName: string | null;
    name: string | null;
    slug: string | null;
    description: string | null;
    documentType: string;
    fileType: string;
    maxSize: number;
    isRequired: boolean;
    sortOrder: number;
    metadata: Record<string, unknown> | null;
    service: ServiceEntity;
}
