import { BadRequestException } from '@nestjs/common';
import {
    mergeUploadedFilesWithMetadata,
    normalizeUploadedDocumentFiles,
    parseApplyServiceDocumentMetadata,
    parseApplyServiceDto,
} from './apply-service-request.parser';

describe('apply-service request parser', () => {
    it('parses multipart apply-service payloads', () => {
        const dto = parseApplyServiceDto({
            form_data: JSON.stringify({
                appointment_request: 'yes',
                fullName: 'Krish',
                pricing_plan: 'Premium',
                scheduled_date: '2026-05-02',
                scheduled_time: '10:00',
            }),
            notes: 'Urgent filing',
            service_id: '12',
        });

        expect(dto).toEqual({
            form_data: {
                appointment_request: 'yes',
                fullName: 'Krish',
                pricing_plan: 'Premium',
                scheduled_date: '2026-05-02',
                scheduled_time: '10:00',
            },
            notes: 'Urgent filing',
            service_id: 12,
        });
    });

    it('maps document metadata onto uploaded files', () => {
        const metadata = parseApplyServiceDocumentMetadata({
            document_metadata: JSON.stringify([
                {
                    notes: 'Front side',
                    service_document_id: 51,
                    type: 'Aadhaar Card',
                },
            ]),
        });

        const files = mergeUploadedFilesWithMetadata(
            [
                {
                    buffer: Buffer.from('file'),
                    mimetype: 'application/pdf',
                    originalname: 'aadhaar.pdf',
                    size: 123,
                },
            ],
            metadata,
        );

        expect(files[0]).toMatchObject({
            notes: 'Front side',
            serviceDocumentId: 51,
            type: 'Aadhaar Card',
        });
    });

    it('parses bracket-style legacy document metadata fields', () => {
        const metadata = parseApplyServiceDocumentMetadata({
            'documents[1][notes]': 'Back side',
            'documents[1][service_document_id]': '77',
            'documents[1][type]': 'PAN Card',
            'documents[0][notes]': 'Front side',
            'documents[0][service_document_id]': '51',
            'documents[0][type]': 'Aadhaar Card',
        });

        expect(metadata).toEqual([
            {
                document_category: null,
                document_type: null,
                existing_document_id: null,
                is_final: undefined,
                notes: 'Front side',
                service_document_id: 51,
                source_document_id: null,
                type: 'Aadhaar Card',
            },
            {
                document_category: null,
                document_type: null,
                existing_document_id: null,
                is_final: undefined,
                notes: 'Back side',
                service_document_id: 77,
                source_document_id: null,
                type: 'PAN Card',
            },
        ]);
    });

    it('parses object-style nested document metadata fields', () => {
        const metadata = parseApplyServiceDocumentMetadata({
            documents: {
                '1': {
                    notes: 'Back side',
                    service_document_id: '77',
                    type: 'PAN Card',
                },
                '0': {
                    notes: 'Front side',
                    service_document_id: '51',
                    type: 'Aadhaar Card',
                },
            },
        });

        expect(metadata).toEqual([
            {
                document_category: null,
                document_type: null,
                existing_document_id: null,
                is_final: undefined,
                notes: 'Front side',
                service_document_id: 51,
                source_document_id: null,
                type: 'Aadhaar Card',
            },
            {
                document_category: null,
                document_type: null,
                existing_document_id: null,
                is_final: undefined,
                notes: 'Back side',
                service_document_id: 77,
                source_document_id: null,
                type: 'PAN Card',
            },
        ]);
    });

    it('normalizes bracket-style legacy uploaded file fields', () => {
        const files = normalizeUploadedDocumentFiles([
            {
                buffer: Buffer.from('second'),
                fieldname: 'documents[1][file]',
                mimetype: 'application/pdf',
                originalname: 'pan.pdf',
                size: 321,
            },
            {
                buffer: Buffer.from('first'),
                fieldname: 'documents[0][file]',
                mimetype: 'application/pdf',
                originalname: 'aadhaar.pdf',
                size: 123,
            },
        ]);

        expect(files.map((file) => file.originalname)).toEqual([
            'aadhaar.pdf',
            'pan.pdf',
        ]);
    });

    it('rejects invalid form_data JSON', () => {
        expect(() =>
            parseApplyServiceDto({
                form_data: '{bad json',
                service_id: '7',
            }),
        ).toThrow(BadRequestException);
    });
});
