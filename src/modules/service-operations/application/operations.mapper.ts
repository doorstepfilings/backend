import { toServiceResource } from '../../catalog/application/catalog.mapper';
import { toUserResource } from '../../identity/application/identity.mapper';
import { normalizePaymentStatus, PAYMENT_STATUS } from './payment-status';

type UserServiceResourceOptions = {
  includeInternalDocuments?: boolean;
  includeInternalNotes?: boolean;
  includeHiddenStages?: boolean;
  ownerUserId?: number | null;
};

const SYSTEM_PROGRESS_STAGES = [
  { key: 'applied', label: 'Application Received' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted_to_ca', label: 'Submitted to CA' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
] as const;

const SYSTEM_STATUS_STAGE_INDEX: Record<string, number> = {
  applied: 0,
  paid: 0,
  payment_pending: 0,
  under_review: 1,
  update_required: 1,
  in_progress: 2,
  submitted_to_ca: 3,
  approved: 4,
  completed: 5,
};

const JOURNEY_PAYMENT_STAGES = [
  { key: 'created', label: 'Created' },
  { key: 'payment_pending', label: 'Pending Payment' },
  { key: 'payment_verified', label: 'Payment Verified' },
] as const;

const SYSTEM_JOURNEY_SERVICE_STAGES = [
  { key: 'under_review', label: 'Under Review' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted_to_ca', label: 'Submitted to CA' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
] as const;

const SYSTEM_JOURNEY_STATUS_STAGE_INDEX: Record<string, number> = {
  under_review: 0,
  update_required: 0,
  in_progress: 1,
  submitted_to_ca: 2,
  approved: 3,
  completed: 4,
};

const WORKFLOW_STAGE_SLUGS_BY_TERMINAL_STATUS: Record<string, string[]> = {
  approved: ['completed', 'complete'],
  completed: ['completed', 'complete'],
  cancelled: ['cancelled', 'canceled', 'cancel'],
};

const MUTUALLY_EXCLUSIVE_TERMINAL_STAGE_SLUGS: Record<string, string[]> = {
  approved: ['cancelled', 'canceled', 'cancel'],
  completed: ['cancelled', 'canceled', 'cancel'],
  cancelled: ['completed', 'complete'],
};

function normalizeWorkflowSlug(workflow: any) {
  return String(workflow?.stage?.slug ?? workflow?.slug ?? '')
    .trim()
    .toLowerCase();
}

function findWorkflowForTerminalStatus(status: string, workflows: any[]) {
  const candidateSlugs = WORKFLOW_STAGE_SLUGS_BY_TERMINAL_STATUS[status] ?? [];

  if (candidateSlugs.length === 0) {
    return null;
  }

  return (
    workflows.find((workflow) =>
      candidateSlugs.includes(normalizeWorkflowSlug(workflow)),
    ) ?? null
  );
}

function isMutuallyExclusiveTerminalStage(status: string, workflow: any) {
  const excludedSlugs = MUTUALLY_EXCLUSIVE_TERMINAL_STAGE_SLUGS[status] ?? [];

  return excludedSlugs.includes(normalizeWorkflowSlug(workflow));
}

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

  // 3. Staff Uploads (Accountant/Admin/RM)
  if (isStaffRole) {
    // Only show if the document is finalized/approved/verified
    const status = String(document.status || '').toLowerCase();
    const isReady = ['approved', 'verified'].includes(status);
    if (!isReady) return false;

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

export function toServiceRequestDocumentResource(document: any) {
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

export function toServiceWorkflowStageResource(workflow: any) {
  const stage = workflow.stage ?? workflow;

  return {
    id: workflow.id,
    stage_id: workflow.stageId ?? stage.id,
    name: stage.name,
    slug: stage.slug,
    color: stage.color ?? '#1d4ed8',
    order_index: workflow.position ?? stage.orderIndex,
    position: workflow.position ?? stage.orderIndex,
    is_active: Boolean(stage.isActive),
    is_required: Boolean(workflow.isRequired ?? true),
  };
}

function buildSystemProgress(userService: any) {
  const currentStageIndex =
    SYSTEM_STATUS_STAGE_INDEX[String(userService.status || '').toLowerCase()];
  const resolvedIndex = currentStageIndex === undefined ? 0 : currentStageIndex;

  const stages = SYSTEM_PROGRESS_STAGES.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    order_index: index + 1,
    is_completed: index < resolvedIndex,
    is_current: index === resolvedIndex,
  }));

  return {
    mode: 'system',
    percent: Math.round(
      ((resolvedIndex + 1) / SYSTEM_PROGRESS_STAGES.length) * 100,
    ),
    current_stage: stages[resolvedIndex] ?? null,
    stages,
  };
}

function buildCustomProgress(userService: any) {
  const allWorkflows = Array.isArray(userService.service?.serviceWorkflows)
    ? userService.service.serviceWorkflows
        .filter(
          (workflow: any) =>
            workflow && workflow.stage && workflow.stage.isActive !== false,
        )
        .sort(
          (left: any, right: any) =>
            Number(left.position) - Number(right.position) ||
            Number(left.id) - Number(right.id),
        )
    : [];

  if (allWorkflows.length === 0) {
    return null;
  }

  const status = String(userService.status || '').toLowerCase();
  const terminalWorkflow = findWorkflowForTerminalStatus(status, allWorkflows);
  const currentWorkflow =
    terminalWorkflow ??
    userService.currentWorkflow ??
    allWorkflows.find(
      (workflow: any) =>
        Number(workflow.id) === Number(userService.currentServiceWorkflowId),
    ) ??
    null;
  const currentPosition = currentWorkflow
    ? Number(currentWorkflow.position)
    : null;

  const stages = allWorkflows.map((workflow: any) => {
    const isCurrent = Number(workflow.id) === Number(currentWorkflow?.id ?? 0);
    const isExcludedTerminalStage = isMutuallyExclusiveTerminalStage(
      status,
      workflow,
    );
    const isCompleted =
      !isExcludedTerminalStage &&
      currentPosition !== null &&
      Number(workflow.position) < currentPosition;
    return {
      ...toServiceWorkflowStageResource(workflow),
      is_completed: isCompleted,
      is_current: isCurrent,
    };
  });

  const currentVisibleIndex = stages.findIndex(
    (stage: any) => stage.is_current,
  );
  const percent =
    stages.length === 0 || currentVisibleIndex < 0
      ? 0
      : Math.round(((currentVisibleIndex + 1) / stages.length) * 100);

  return {
    mode: 'custom',
    percent,
    current_stage:
      stages.find((stage: any) => stage.is_current) ??
      (currentWorkflow
        ? {
            ...toServiceWorkflowStageResource(currentWorkflow),
            is_completed: false,
            is_current: true,
          }
        : null),
    stages,
  };
}

function resolveWorkflowStages(userService: any) {
  return Array.isArray(userService.service?.serviceWorkflows)
    ? userService.service.serviceWorkflows
        .filter(
          (workflow: any) =>
            workflow &&
            workflow.stage &&
            workflow.stage.isActive !== false &&
            Number(workflow.position || 0) < 1000,
        )
        .sort(
          (left: any, right: any) =>
            Number(left.position) - Number(right.position) ||
            Number(left.id) - Number(right.id),
        )
    : [];
}

function resolveCurrentWorkflow(userService: any, workflows: any[]) {
  return (
    userService.currentWorkflow ??
    workflows.find(
      (workflow: any) =>
        Number(workflow.id) === Number(userService.currentServiceWorkflowId),
    ) ??
    null
  );
}

function hasVerifiedPayment(userService: any) {
  const status = String(userService.status || '').toLowerCase();

  if (
    [
      'applied',
      'paid',
      'under_review',
      'update_required',
      'in_progress',
      'submitted_to_ca',
      'approved',
      'completed',
    ].includes(status)
  ) {
    return true;
  }

  return (
    normalizePaymentStatus(userService.paymentStatus) === PAYMENT_STATUS.PAID
  );
}

function buildJourneyResult(stages: any[], mode: 'system' | 'workflow') {
  const currentIndex = stages.findIndex((stage: any) => stage.is_current);
  const percent =
    stages.length === 0
      ? 0
      : currentIndex >= 0
        ? Math.round(((currentIndex + 1) / stages.length) * 100)
        : Math.round(
            (stages.filter((stage: any) => stage.is_completed).length /
              stages.length) *
              100,
          );

  return {
    mode,
    percent,
    current_stage: stages.find((stage: any) => stage.is_current) ?? null,
    stages,
  };
}

function buildWorkflowJourney(userService: any) {
  const workflows = resolveWorkflowStages(userService);

  if (workflows.length === 0) {
    return null;
  }

  const status = String(userService.status || '').toLowerCase();
  const paymentVerified = hasVerifiedPayment(userService);
  const currentWorkflow = resolveCurrentWorkflow(userService, workflows);
  const activeWorkflow =
    findWorkflowForTerminalStatus(status, workflows) ?? currentWorkflow;
  const activeWorkflowPosition = activeWorkflow
    ? Number(activeWorkflow.position)
    : null;

  const stages = [
    ...JOURNEY_PAYMENT_STAGES.map((stage, index) => {
      if (stage.key === 'created') {
        return {
          key: stage.key,
          label: stage.label,
          order_index: index + 1,
          source: 'system',
          is_completed: status !== 'in_cart',
          is_current: status === 'in_cart',
        };
      }

      if (stage.key === 'payment_pending') {
        return {
          key: stage.key,
          label: stage.label,
          order_index: index + 1,
          source: 'system',
          is_completed: paymentVerified,
          is_current: !paymentVerified && status !== 'in_cart',
        };
      }

      return {
        key: stage.key,
        label: stage.label,
        order_index: index + 1,
        source: 'system',
        is_completed: Boolean(activeWorkflow),
        is_current: paymentVerified && !activeWorkflow,
      };
    }),
    ...workflows.map((workflow: any, index: number) => ({
      ...toServiceWorkflowStageResource(workflow),
      key: workflow.stage?.slug ?? `workflow-${workflow.id}`,
      label: workflow.stage?.name ?? workflow.name,
      order_index: JOURNEY_PAYMENT_STAGES.length + index + 1,
      source: 'workflow',
      workflow_id: Number(workflow.id),
      is_completed:
        !isMutuallyExclusiveTerminalStage(status, workflow) &&
        activeWorkflowPosition !== null &&
        Number(workflow.position) < activeWorkflowPosition,
      is_current: Number(workflow.id) === Number(activeWorkflow?.id ?? 0),
    })),
  ];

  return buildJourneyResult(stages, 'workflow');
}

function buildSystemJourney(userService: any) {
  const status = String(userService.status || '').toLowerCase();
  const paymentVerified = hasVerifiedPayment(userService);
  const currentServiceStageIndex = SYSTEM_JOURNEY_STATUS_STAGE_INDEX[status];

  const stages = [
    ...JOURNEY_PAYMENT_STAGES.map((stage, index) => {
      if (stage.key === 'created') {
        return {
          key: stage.key,
          label: stage.label,
          order_index: index + 1,
          source: 'system',
          is_completed: status !== 'in_cart',
          is_current: status === 'in_cart',
        };
      }

      if (stage.key === 'payment_pending') {
        return {
          key: stage.key,
          label: stage.label,
          order_index: index + 1,
          source: 'system',
          is_completed: paymentVerified,
          is_current: !paymentVerified && status !== 'in_cart',
        };
      }

      return {
        key: stage.key,
        label: stage.label,
        order_index: index + 1,
        source: 'system',
        is_completed: paymentVerified && currentServiceStageIndex !== undefined,
        is_current: paymentVerified && currentServiceStageIndex === undefined,
      };
    }),
    ...SYSTEM_JOURNEY_SERVICE_STAGES.map((stage, index) => ({
      key: stage.key,
      label: stage.label,
      order_index: JOURNEY_PAYMENT_STAGES.length + index + 1,
      source: 'system',
      is_completed:
        currentServiceStageIndex !== undefined &&
        index < currentServiceStageIndex,
      is_current: index === currentServiceStageIndex,
    })),
  ];

  return buildJourneyResult(stages, 'system');
}

export function toUserServiceResource(
  userService: any,
  options: UserServiceResourceOptions = {},
) {
  const {
    includeHiddenStages = true,
    includeInternalDocuments = true,
    includeInternalNotes = true,
    ownerUserId = null,
  } = options;
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
  const workflowStages = resolveWorkflowStages(userService);
  const currentWorkflow = resolveCurrentWorkflow(userService, workflowStages);

  const progress =
    buildCustomProgress(userService) ?? buildSystemProgress(userService);
  const journey =
    buildWorkflowJourney(userService) ?? buildSystemJourney(userService);

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
    status: userService.status,
    payment_status: normalizePaymentStatus(userService.paymentStatus),
    form_data: userService.formData,
    documents: documentMap,
    request_documents: requestDocuments.map(toServiceRequestDocumentResource),
    amount: userService.amount,
    notes: userService.notes,
    client_message: userService.clientMessage ?? null,
    progress,
    journey,
    revision_notes: userService.revisionNotes,
    ...(includeInternalNotes
      ? {
          ca_notes: userService.caNotes,
          update_note: userService.updateNote,
          rejection_reason: userService.rejectionReason,
        }
      : {}),
    verified: Boolean(userService.verified),
    certificate_url: userService.certificateUrl,
    current_service_workflow_id: userService.currentServiceWorkflowId ?? null,
    current_workflow: currentWorkflow
      ? toServiceWorkflowStageResource(currentWorkflow)
      : null,
    workflow_stages: workflowStages.map(toServiceWorkflowStageResource),
    is_custom_workflow: Boolean(userService.isCustomWorkflow ?? false),
    has_workflow: Boolean(userService.hasWorkflow ?? workflowStages.length > 0),
    progression_control: {
      mode: workflowStages.length > 0 ? 'workflow' : 'status',
      lifecycle_status_editable: false,
      workflow_stage_editable: workflowStages.length > 0,
      has_workflow: Boolean(
        userService.hasWorkflow ?? workflowStages.length > 0,
      ),
      is_custom_workflow: Boolean(userService.isCustomWorkflow ?? false),
    },
    submitted_to_ca_at: userService.submittedToCaAt,
    created_at: userService.createdAt,
    updated_at: userService.updatedAt,
  };
}
