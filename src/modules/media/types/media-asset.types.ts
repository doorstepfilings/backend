export interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
    fieldname: string;
}

export type MediaFolder =
    | 'catalog'
    | 'documents'
    | 'avatars'
    | 'backoffice'
    | 'general';

export const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
