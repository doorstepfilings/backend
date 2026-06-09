import { toServiceResource } from '../../catalog/application/catalog.mapper';
import { toUserResource } from '../../identity/application/identity.mapper';
import { normalizePaymentStatus } from './payment-status';

type UserServiceResourceOptions = {
  includeInternalDocuments?: boolean;
  ownerUserId?: number | null;
};

function toJsonSafeScalar(value: unknown) {
  if (typeof value === 'bigint') {
    const numericValue = Number(value);
    return Number.isSafeInteger(numericValue) ? numericValue : value.toString();
  }

  return value;
}

function looksLikeCertificate(document: any) {
  if (document.documentCategory === 'certificate') {
    return true;
  }

  const haystack =
    `${document.documentType || ''} ${document.documentCategory || ''} ${document.fileName || ''}`.toLowerCase();
  return haystack.includes('certificate');
}

function looksLikeReport(document: any) {
  if (document.documentCategory === 'report') {
    return true;
  }

  const haystack =
    `${document.documentType || ''} ${document.documentCategory || ''} ${document.fileName || ''}`.toLowerCase();
  return haystack.includes('report');
}

function isClientVisibleDocument(document: any, ownerUserId?: number | null) {
  const type = String(document.documentType || '').toLowerCase();
  const category = String(document.documentCategory || '').toLowerCase();
  const role = String(document.uploadedBy?.role || '').toLowerCase();

  const isStaffRole = [
    'accountant',
    'admin',
    'super_admin',
    'regional_manager',
    'rm',
    'employee',
  ].includes(role);

  // 1. Explicit Internal markers (Sole Source of Truth - hide always)
  if (['internal', 'internal_only', 'internal_document'].includes(type)) {
    return false;
  }
  if (['internal', 'internal_document'].includes(category)) {
    return false;
  }

  // 2. User/Customer Role (Clients always see their own uploads)
  if (role === 'user' || role === 'customer') {
    return true;
  }

  // Also check by ID if role is missing or ambiguous
  if (
    ownerUserId !== null &&
    ownerUserId !== undefined &&
    String(document.uploadedById) === String(ownerUserId)
  ) {
    return true;
  }

  // For any staff/fallback uploads, certificates and reports MUST be approved or verified to be visible to the client
  if (
    ['certificate', 'report'].includes(category) ||
    looksLikeCertificate(document) ||
    looksLikeReport(document)
  ) {
    const status = String(document.status || '').toLowerCase();
    const isReady = ['approved', 'verified'].includes(status);
    if (!isReady) return false;
  }

  // 3. Staff Uploads (Accountant/Admin/RM)
  if (isStaffRole) {
    // Only show if explicitly marked as client visible
    if (type === 'client' || type === 'client_document') return true;
    if (category === 'client_document' || category === 'client_visible')
      return true;

    // Certificates and Reports are usually deliverables
    if (['certificate', 'report'].includes(category)) return true;

    // Explicit final deliveries
    if (document.isFinal) return true;

    // Heuristics (ONLY if no explicit type is set)
    if (!type || type === 'null' || type === 'undefined') {
      if (looksLikeCertificate(document) || looksLikeReport(document)) {
        return true;
      }
    }

    // Default for staff: Internal (Hidden from client)
    return false;
  }

  // 4. Fallback for legacy or unknown roles
  if (type === 'client' || type === 'client_document') return true;
  if (['certificate', 'report', 'other'].includes(category)) {
    // Certificates and Reports should generally be approved to be visible to clients
    const status = String(document.status || '').toLowerCase();
    return ['approved', 'verified'].includes(status);
  }

  return false;
}

function toServiceRequestDocumentResource(document: any) {
  const resolvedFileUrl = document.filePath ?? document.fileUrl ?? null;

  return {
    id: document.id,
    document_type: document.documentType,
    document_category: document.documentCategory,
    document_name: document.documentName,
    service_document_id: document.serviceDocumentId,
    source_document_id: document.sourceDocumentId,
    file_name: document.fileName,
    file_url: resolvedFileUrl,
    file_size: toJsonSafeScalar(document.fileSize),
    mime_type: document.mimeType,
    version: document.version,
    status: document.status,
    notes: document.notes,
    is_final: Boolean(document.isFinal),
    uploaded_by: document.uploadedBy
      ? {
          id: document.uploadedBy.id,
          name: document.uploadedBy.name,
          role: document.uploadedBy.role,
        }
      : null,
    created_at: document.createdAt,
    uploaded_at: document.createdAt,
  };
}

export function toUserServiceResource(
  userService: any,
  options: UserServiceResourceOptions = {},
) {
  const { includeInternalDocuments = true, ownerUserId = null } = options;
  let requestDocuments = Array.isArray(userService.requestDocuments)
    ? includeInternalDocuments
      ? userService.requestDocuments
      : userService.requestDocuments.filter((document: any) =>
          isClientVisibleDocument(document, ownerUserId),
        )
    : [];

  // Logic: If a certificate or report is approved, hide other pending versions of it.
  // Also, if the service itself is approved/completed, we should generally only show finalized/approved documents to the client.
  if (!includeInternalDocuments) {
    const approvedCategories = new Set(
      requestDocuments
        .filter(
          (document: any) =>
            document.status === 'approved' || document.status === 'verified',
        )
        .map((document: any) => document.documentCategory)
        .filter(Boolean),
    );

    requestDocuments = requestDocuments.filter((doc: any) => {
      const status = String(doc.status || '').toLowerCase();
      const category = String(doc.documentCategory || '').toLowerCase();

      // If we have an approved version of this category (like 'report'), hide the pending ones
      if (
        status === 'pending' &&
        approvedCategories.has(doc.documentCategory)
      ) {
        return false;
      }

      // Hide all pending certificates and reports from clients if they aren't approved yet
      if (
        status === 'pending' &&
        (category === 'report' || category === 'certificate')
      ) {
        return false;
      }

      // If the whole service is approved/completed, hide remaining pending documents from the client view
      if (
        ['approved', 'completed'].includes(userService.status) &&
        status === 'pending'
      ) {
        return false;
      }

      return true;
    });
  }

  const documentMap = includeInternalDocuments
    ? userService.documents
    : Object.fromEntries(
        requestDocuments.map((document: any) => [
          document.documentName || document.documentType || document.fileName,
          document.filePath ?? document.fileUrl ?? null,
        ]),
      );

  return {
    id: userService.id,
    service_id: userService.serviceId,
    user: userService.user ? toUserResource(userService.user) : null,
    accountant: userService.accountant
      ? toUserResource(userService.accountant)
      : null,
    service: userService.service
      ? toServiceResource(userService.service)
      : null,
    application_unique_id: userService.applicationUniqueId,
    order_unique_id: userService.latestPayment?.orderUniqueId ?? null,
    invoice_unique_id: userService.latestPayment?.invoiceUniqueId ?? null,
    payment_id: userService.latestPayment?.id ?? null,
    order_created_at: userService.latestPayment?.createdAt ?? null,
    transaction_id: userService.latestPayment?.paymentProviderTransactionId ?? null,
    payment_method: userService.latestPayment?.paymentMethod ?? null,
    status: userService.status,
    payment_status: normalizePaymentStatus(userService.paymentStatus),
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
