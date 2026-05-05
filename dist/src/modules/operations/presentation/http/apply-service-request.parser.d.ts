import { ApplyServiceDto } from './dto/apply-service.dto';
import type { UploadedDocumentFile } from '../../application/document-upload.service';
type ApplyServiceBody = Record<string, unknown>;
type UploadedRequestDocumentFile = UploadedDocumentFile & {
    fieldname?: string;
};
type ApplyServiceDocumentMetadata = {
    document_category?: string | null;
    document_type?: string | null;
    existing_document_id?: number | null;
    is_final?: boolean;
    notes?: string | null;
    service_document_id?: number | null;
    source_document_id?: number | null;
    type?: string | null;
};
export declare function parseApplyServiceDto(body: ApplyServiceBody): ApplyServiceDto;
export declare function parseApplyServiceDocumentMetadata(body: ApplyServiceBody): ApplyServiceDocumentMetadata[];
export declare function normalizeUploadedDocumentFiles(files?: UploadedRequestDocumentFile[]): UploadedDocumentFile[];
export declare function mergeUploadedFilesWithMetadata(files?: UploadedDocumentFile[], metadata?: ApplyServiceDocumentMetadata[]): UploadedDocumentFile[];
export {};
