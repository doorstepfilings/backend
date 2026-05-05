import { BadRequestException } from '@nestjs/common';
import {
    ApplyServiceDto,
    type ApplyServiceFormData,
} from './dto/apply-service.dto';
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

const BRACKET_DOCUMENT_FIELD_PATTERN = /^documents\[(\d+)\]\[([^\]]+)\]$/;
const BRACKET_DOCUMENT_FILE_PATTERN = /^documents\[(\d+)\]\[file\]$/;

function parseJsonField<T>(value: unknown, fieldName: string): T {
    if (typeof value !== 'string') {
        throw new BadRequestException(`${fieldName} must be a JSON string`);
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        throw new BadRequestException(`${fieldName} contains invalid JSON`);
    }
}

function normalizePositiveNumber(
    value: unknown,
    fieldName: string,
    required = false,
): number | undefined {
    if (value === null || value === undefined || value === '') {
        if (required) {
            throw new BadRequestException(`${fieldName} is required`);
        }
        return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new BadRequestException(
            `${fieldName} must be a positive integer`,
        );
    }

    return parsed;
}

function normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}

function normalizeDocumentMetadataRecord(
    record: Record<string, unknown>,
    index: number,
): ApplyServiceDocumentMetadata {
    return {
        document_category: normalizeString(record['document_category']) ?? null,
        document_type: normalizeString(record['document_type']) ?? null,
        existing_document_id:
            normalizePositiveNumber(
                record['existing_document_id'],
                `documents[${index}][existing_document_id]`,
            ) ?? null,
        is_final:
            typeof record['is_final'] === 'boolean'
                ? record['is_final']
                : String(record['is_final']).toLowerCase() === 'true',
        notes: normalizeString(record['notes']) ?? null,
        service_document_id:
            normalizePositiveNumber(
                record['service_document_id'],
                `documents[${index}][service_document_id]`,
            ) ?? null,
        source_document_id:
            normalizePositiveNumber(
                record['source_document_id'],
                `documents[${index}][source_document_id]`,
            ) ?? null,
        type: normalizeString(record['type']) ?? null,
    };
}

export function parseApplyServiceDto(body: ApplyServiceBody): ApplyServiceDto {
    const serviceId = normalizePositiveNumber(
        body['service_id'],
        'service_id',
        true,
    );
    const rawFormData = body['form_data'];
    const formData =
        typeof rawFormData === 'string'
            ? parseJsonField<ApplyServiceFormData>(rawFormData, 'form_data')
            : (rawFormData as ApplyServiceFormData | undefined);

    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
        throw new BadRequestException('form_data must be an object');
    }

    return {
        service_id: serviceId!,
        form_data: formData,
        notes: normalizeString(body['notes']),
    };
}

export function parseApplyServiceDocumentMetadata(
    body: ApplyServiceBody,
): ApplyServiceDocumentMetadata[] {
    const rawMetadata = body['document_metadata'];

    if (
        rawMetadata === null ||
        rawMetadata === undefined ||
        rawMetadata === ''
    ) {
        const indexedRecords = new Map<number, Record<string, unknown>>();

        Object.entries(body).forEach(([key, value]) => {
            const match = key.match(BRACKET_DOCUMENT_FIELD_PATTERN);
            if (!match) {
                return;
            }

            const index = Number(match[1]);
            const field = match[2];

            if (!Number.isInteger(index) || field === 'file') {
                return;
            }

            const record = indexedRecords.get(index) ?? {};
            record[field] = value;
            indexedRecords.set(index, record);
        });

        return [...indexedRecords.entries()]
            .sort(([left], [right]) => left - right)
            .map(([index, record]) =>
                normalizeDocumentMetadataRecord(record, index),
            );
    }

    const metadata =
        typeof rawMetadata === 'string'
            ? parseJsonField<ApplyServiceDocumentMetadata[]>(
                  rawMetadata,
                  'document_metadata',
              )
            : rawMetadata;

    if (!Array.isArray(metadata)) {
        throw new BadRequestException('document_metadata must be an array');
    }

    return metadata.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new BadRequestException(
                `document_metadata[${index}] must be an object`,
            );
        }

        return normalizeDocumentMetadataRecord(
            item as Record<string, unknown>,
            index,
        );
    });
}

export function normalizeUploadedDocumentFiles(
    files: UploadedRequestDocumentFile[] = [],
): UploadedDocumentFile[] {
    return files
        .map((file, index) => {
            const fieldname = file.fieldname ?? '';
            const bracketMatch = fieldname.match(BRACKET_DOCUMENT_FILE_PATTERN);
            const isLegacyBracketField = Boolean(bracketMatch);
            const isCanonicalField = !fieldname || fieldname === 'documents';

            if (!isCanonicalField && !isLegacyBracketField) {
                return null;
            }

            return {
                file,
                originalIndex: index,
                sortIndex: bracketMatch ? Number(bracketMatch[1]) : index,
            };
        })
        .filter(
            (
                candidate,
            ): candidate is {
                file: UploadedDocumentFile;
                originalIndex: number;
                sortIndex: number;
            } => candidate !== null,
        )
        .sort((left, right) => {
            if (left.sortIndex === right.sortIndex) {
                return left.originalIndex - right.originalIndex;
            }

            return left.sortIndex - right.sortIndex;
        })
        .map(({ file }) => file);
}

export function mergeUploadedFilesWithMetadata(
    files: UploadedDocumentFile[] = [],
    metadata: ApplyServiceDocumentMetadata[] = [],
): UploadedDocumentFile[] {
    return files.map((file, index) => {
        const item = metadata[index] ?? {};

        return {
            ...file,
            documentCategory: item.document_category ?? undefined,
            documentType: item.document_type ?? undefined,
            isFinal: item.is_final ?? undefined,
            notes: item.notes ?? undefined,
            serviceDocumentId: item.service_document_id ?? undefined,
            sourceDocumentId: item.source_document_id ?? undefined,
            type: item.type ?? undefined,
        };
    });
}
