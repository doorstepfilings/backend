"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserServiceResource = toUserServiceResource;
const catalog_mapper_1 = require("../../catalog/application/catalog.mapper");
const identity_mapper_1 = require("../../identity/application/identity.mapper");
function looksLikeCertificate(document) {
    if (document.documentCategory === 'certificate') {
        return true;
    }
    const haystack = `${document.documentType || ''} ${document.documentCategory || ''} ${document.fileName || ''}`.toLowerCase();
    return haystack.includes('certificate');
}
function looksLikeReport(document) {
    if (document.documentCategory === 'report') {
        return true;
    }
    const haystack = `${document.documentType || ''} ${document.documentCategory || ''} ${document.fileName || ''}`.toLowerCase();
    return haystack.includes('report');
}
function isClientVisibleDocument(document, ownerUserId) {
    if (document.documentType === 'client') {
        return true;
    }
    if (document.documentCategory === 'client_document') {
        return true;
    }
    if (['certificate', 'report', 'other'].includes(String(document.documentCategory || '').toLowerCase())) {
        return true;
    }
    if (looksLikeCertificate(document) || looksLikeReport(document)) {
        return true;
    }
    if (ownerUserId !== null &&
        ownerUserId !== undefined &&
        String(document.uploadedById) === String(ownerUserId)) {
        return true;
    }
    return document.uploadedBy?.role === 'user';
}
function toServiceRequestDocumentResource(document) {
    return {
        id: document.id,
        document_type: document.documentType,
        document_category: document.documentCategory,
        document_name: document.documentName,
        service_document_id: document.serviceDocumentId,
        source_document_id: document.sourceDocumentId,
        file_name: document.fileName,
        file_url: document.fileUrl,
        file_size: document.fileSize,
        mime_type: document.mimeType,
        version: document.version,
        status: document.status,
        notes: document.notes,
        is_final: Boolean(document.isFinal),
        uploaded_by: document.uploadedBy
            ? {
                id: document.uploadedBy.id,
                name: document.uploadedBy.name,
            }
            : null,
        created_at: document.createdAt,
        uploaded_at: document.createdAt,
    };
}
function toUserServiceResource(userService, options = {}) {
    const { includeInternalDocuments = true, ownerUserId = null } = options;
    const requestDocuments = Array.isArray(userService.requestDocuments)
        ? includeInternalDocuments
            ? userService.requestDocuments
            : userService.requestDocuments.filter((document) => isClientVisibleDocument(document, ownerUserId))
        : [];
    const documentMap = includeInternalDocuments
        ? userService.documents
        : Object.fromEntries(requestDocuments.map((document) => [
            document.documentName ||
                document.documentType ||
                document.fileName,
            document.fileUrl,
        ]));
    return {
        id: userService.id,
        service_id: userService.serviceId,
        user: userService.user ? (0, identity_mapper_1.toUserResource)(userService.user) : null,
        accountant: userService.accountant
            ? (0, identity_mapper_1.toUserResource)(userService.accountant)
            : null,
        service: userService.service
            ? (0, catalog_mapper_1.toServiceResource)(userService.service)
            : null,
        application_unique_id: userService.applicationUniqueId,
        status: userService.status,
        payment_status: userService.paymentStatus,
        form_data: userService.formData,
        documents: documentMap,
        request_documents: requestDocuments.map(toServiceRequestDocumentResource),
        amount: userService.amount,
        notes: userService.notes,
        revision_notes: userService.revisionNotes,
        ca_notes: userService.caNotes,
        update_note: userService.updateNote,
        rejection_reason: userService.rejectionReason,
        verified: Boolean(userService.verified),
        certificate_url: userService.certificateUrl,
        submitted_to_ca_at: userService.submittedToCaAt,
        created_at: userService.createdAt,
        updated_at: userService.updatedAt,
    };
}
//# sourceMappingURL=operations.mapper.js.map