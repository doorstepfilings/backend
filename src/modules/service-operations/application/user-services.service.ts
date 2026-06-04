import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toUserServiceResource } from './operations.mapper';
import { buildAdminApplicationWhere } from './user-service-status';
import {
  getPaidPaymentStatusValues,
  HIDDEN_USER_SERVICE_STATUSES,
  isSettledPaymentRecord,
  PAYMENT_STATUS,
  USER_SERVICE_PAYMENT_PENDING_STATUS,
} from './payment-status';
import {
  DocumentUploadService,
  type UploadedDocumentFile,
} from './document-upload.service';
import { SlotsService } from './slots.service';
import {
  ApplyServiceDto,
  type ApplyServiceFormData,
} from '../presentation/http/dto/apply-service.dto';

type PricingPlan = {
  name?: string;
  price?: number | string;
};

const CLOSED_USER_SERVICE_STATUSES = new Set([
  'approved',
  'completed',
  'cancelled',
  'rejected',
]);

export type UpdateApplicationStatusInput = {
  status: string;
  ca_notes?: string;
  certificate_url?: string;
  client_message?: string;
  rejection_reason?: string;
  update_note?: string;
};

export type UpdateRequestStageInput = {
  service_workflow_id?: number | null;
  client_message?: string;
  target_status?: string;
};

@Injectable()
export class UserServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotsService: SlotsService,
    private readonly documentUploadService: DocumentUploadService,
  ) {}

  async getMyServices(userId: number) {
    // Keep newly added cart and payment-pending services visible to the user.
    const services = (await this.prisma.userService.findMany({
      where: {
        userId,
      },
      include: {
        accountant: true,
        service: {
          include: {
            category: true,
            documents: true,
          },
        },
        user: {
          include: {
            accountant: true,
            regionalManager: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as any[];

    await this.populateRequestDocuments(services);
    await this.populateLatestPayments(services);
    await this.populateStageProgress(services);
    this.sortByLatestOrderFirst(services);

    return services.map((service) =>
      toUserServiceResource(service, {
        includeHiddenStages: false,
        includeInternalDocuments: false,
        includeInternalNotes: false,
        ownerUserId: userId,
      }),
    );
  }

  async applyForService(
    userId: number,
    dto: ApplyServiceDto,
    files: UploadedDocumentFile[] = [],
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.service_id },
      include: { documents: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const formData: ApplyServiceFormData = dto.form_data;

    // Slot verification
    if (formData.appointment_request === 'yes') {
      const scheduledDate = formData.scheduled_date;
      const scheduledTime = formData.scheduled_time;

      if (!scheduledDate || !scheduledTime) {
        throw new BadRequestException('Appointment date and time are required');
      }

      const availability = await this.slotsService.getAvailability(
        dto.service_id,
        scheduledDate,
      );
      const slot = availability.find((s) => s.time === scheduledTime);

      if (!slot || slot.is_full || slot.is_past) {
        throw new BadRequestException(
          'Selected slot is full or unavailable. Please choose the next available slot or move to the next day.',
        );
      }
    }

    // Resolve amount (if not already set in cart)
    let amount: Prisma.Decimal | string | number | null = service.price;
    if (formData.pricing_plan && Array.isArray(service.pricingPlans)) {
      const plan = (service.pricingPlans as PricingPlan[]).find(
        (item) => item.name === formData.pricing_plan,
      );
      if (plan?.price !== undefined && plan.price !== null) {
        amount = plan.price;
      }
    }

    // Reuse only an unpaid draft-like request. Paid/completed requests must stay
    // untouched so users can submit the same service again without losing history.
    let userService = await this.prisma.userService.findFirst({
      where: {
        userId,
        serviceId: dto.service_id,
        OR: [
          {
            status: {
              in: ['in_cart', USER_SERVICE_PAYMENT_PENDING_STATUS],
            },
          },
          {
            status: 'applied',
            paymentStatus: {
              notIn: getPaidPaymentStatusValues(),
            },
          },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (userService) {
      userService = await this.prisma.userService.update({
        where: { id: userService.id },
        data: {
          status: USER_SERVICE_PAYMENT_PENDING_STATUS,
          paymentStatus: PAYMENT_STATUS.CREATED,
          formData: formData as any,
          notes: dto.notes || null,
          amount,
        },
      });
    } else {
      userService = await this.prisma.userService.create({
        data: {
          userId,
          serviceId: dto.service_id,
          status: USER_SERVICE_PAYMENT_PENDING_STATUS,
          paymentStatus: PAYMENT_STATUS.CREATED,
          formData: formData as any,
          notes: dto.notes || null,
          amount,
        },
      });
    }

    if (files && files.length > 0) {
      await this.documentUploadService.uploadDocuments(
        userService.id,
        userId,
        files,
      );
    }

    // Log enquiry
    await this.prisma.enquiry.create({
      data: {
        name: user.name,
        email: user.email,
        phone: formData.phone || user.mobileNumber,
        service: service.name,
        message: dto.notes || 'Service application submitted',
        status: 'pending',
      },
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id: userService.id },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated, {
      includeHiddenStages: false,
      includeInternalDocuments: false,
      includeInternalNotes: false,
      ownerUserId: userId,
    });
  }

  async uploadMyDocuments(
    userId: number,
    userServiceId: number,
    files: UploadedDocumentFile[],
  ) {
    const userService = await this.prisma.userService.findUnique({
      where: { id: userServiceId, userId },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
      },
    });

    if (!userService) {
      throw new NotFoundException('Service request not found');
    }

    const disallowedStatuses = [
      'in_cart',
      'approved',
      'rejected',
      'cancelled',
      'completed',
    ];

    if (disallowedStatuses.includes(userService.status)) {
      throw new BadRequestException(
        `Documents cannot be uploaded when request is in '${userService.status}' status.`,
      );
    }

    await this.documentUploadService.uploadDocuments(
      userService.id,
      userId,
      files,
    );

    const refreshed = (await this.prisma.userService.findUniqueOrThrow({
      where: { id: userService.id },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
      },
    })) as any;

    await this.populateRequestDocuments(refreshed);
    await this.populateLatestPayments(refreshed);
    await this.populateStageProgress(refreshed);

    return toUserServiceResource(refreshed, {
      includeHiddenStages: false,
      includeInternalDocuments: false,
      includeInternalNotes: false,
      ownerUserId: userId,
    });
  }

  async deleteMyService(userId: number, userServiceId: number) {
    const userService = (await this.prisma.userService.findUnique({
      where: { id: userServiceId, userId },
      include: {
        requestDocuments: true,
      },
    })) as any;

    if (!userService) {
      throw new NotFoundException('Service request not found');
    }

    if (
      !['applied', 'in_cart', USER_SERVICE_PAYMENT_PENDING_STATUS].includes(
        userService.status,
      )
    ) {
      throw new BadRequestException('Only new applications can be removed.');
    }

    const payments = await this.prisma.payment.findMany({
      where: { userServiceId: userService.id },
    });

    const hasCompletedPayment = payments.some((payment) =>
      isSettledPaymentRecord(payment),
    );

    if (hasCompletedPayment) {
      throw new BadRequestException('Paid applications cannot be removed.');
    }

    for (const document of userService.requestDocuments ?? []) {
      await this.documentUploadService.deleteDocument(
        document.id,
        document.uploadedById,
      );
    }

    if (payments.length > 0) {
      await this.prisma.payment.deleteMany({
        where: { userServiceId: userService.id },
      });
    }

    await this.prisma.userService.delete({ where: { id: userService.id } });

    return true;
  }

  async deleteMyDocument(userId: number, userServiceId: number, docId: number) {
    const userService = await this.prisma.userService.findUnique({
      where: { id: userServiceId, userId },
    });

    if (!userService) {
      throw new NotFoundException('Service request not found');
    }

    const lockedStatuses = ['approved', 'completed', 'rejected', 'cancelled'];

    if (lockedStatuses.includes(userService.status)) {
      throw new BadRequestException(
        `Documents cannot be deleted while the request is in '${userService.status}' status.`,
      );
    }

    await this.documentUploadService.deleteDocument(docId, userId);

    return true;
  }

  async getAllServices(status?: string) {
    const services = (await this.prisma.userService.findMany({
      where: buildAdminApplicationWhere(status),
      include: {
        accountant: true,
        service: {
          include: {
            category: true,
            documents: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })) as any[];

    await this.populateRequestDocuments(services);
    await this.populateLatestPayments(services);
    await this.populateStageProgress(services);
    this.sortByLatestOrderFirst(services);

    return services.map((service) => toUserServiceResource(service));
  }

  async updateRequestStage(id: number, data: UpdateRequestStageInput) {
    id = this.normalizeInteger(id, 'application_id');

    const userService = await this.prisma.userService.findUniqueOrThrow({
      where: { id },
    });
    const requestedTargetStatus = String(data.target_status || '')
      .trim()
      .toLowerCase();
    let serviceWorkflowId =
      data.service_workflow_id === null ||
      data.service_workflow_id === undefined ||
      data.service_workflow_id === ('' as any)
        ? null
        : this.normalizeInteger(
            data.service_workflow_id,
            'service_workflow_id',
          );
    if (serviceWorkflowId === null && requestedTargetStatus) {
      serviceWorkflowId = await this.getWorkflowIdForStatus(
        Number(userService.serviceId),
        requestedTargetStatus,
      );
    }

    const workflow =
      serviceWorkflowId === null
        ? null
        : await this.prisma.serviceWorkflow.findUnique({
            where: { id: serviceWorkflowId },
            include: { stage: true },
          });

    if (
      serviceWorkflowId !== null &&
      (!workflow ||
        Number(workflow.serviceId) !== Number(userService.serviceId))
    ) {
      throw new BadRequestException(
        'Selected stage does not belong to this service request',
      );
    }

    const normalizedClientMessage =
      data.client_message === undefined
        ? undefined
        : this.normalizeNullableText(data.client_message);

    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.UserServiceUncheckedUpdateInput = {
        clientMessage: normalizedClientMessage,
        currentServiceWorkflowId: serviceWorkflowId,
        currentStageUpdatedAt: serviceWorkflowId ? new Date() : null,
      };
      const targetStatus =
        requestedTargetStatus ||
        this.getStatusForWorkflowStageSlug(workflow?.stage?.slug);

      if (
        targetStatus &&
        targetStatus !== userService.status &&
        this.canTransitionTo(userService.status, targetStatus)
      ) {
        updateData.status = targetStatus;
        this.applyStatusSideEffects(updateData, targetStatus);

        if (normalizedClientMessage === undefined) {
          const defaultClientMessage =
            this.defaultClientMessageForStatus(targetStatus);
          if (defaultClientMessage !== undefined) {
            updateData.clientMessage = defaultClientMessage;
          }
        }
      }

      await tx.userService.update({
        where: { id },
        data: updateData,
      });
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated);
  }

  async updateAccountantRequestStage(
    accountantId: number,
    id: number,
    data: UpdateRequestStageInput,
  ) {
    accountantId = this.normalizeInteger(accountantId, 'accountant_id');
    id = this.normalizeInteger(id, 'application_id');

    await this.prisma.userService.findFirstOrThrow({
      where: {
        accountantId,
        id,
      },
    });

    return this.updateRequestStage(id, data);
  }

  async assignAccountantForRmRequest(
    rmId: number,
    userServiceId: number,
    accountantId: number,
  ) {
    rmId = this.normalizeInteger(rmId, 'rm_id');
    userServiceId = this.normalizeInteger(userServiceId, 'application_id');
    accountantId = this.normalizeInteger(accountantId, 'accountant_id');

    await this.prisma.userService.findFirstOrThrow({
      where: {
        id: userServiceId,
        user: {
          rmId,
        },
      },
    });

    return this.assignAccountantToService(userServiceId, accountantId);
  }

  // Status State Machine
  private static readonly STATUS_FLOW: Record<string, string[]> = {
    in_cart: ['applied'],
    payment_pending: ['paid', 'cancelled'],
    applied: ['under_review', 'approved', 'cancelled'],
    paid: ['under_review', 'approved', 'cancelled'],
    under_review: [
      'applied',
      'update_required',
      'in_progress',
      'approved',
      'cancelled',
    ],
    update_required: ['under_review', 'approved', 'cancelled'],
    in_progress: [
      'under_review',
      'submitted_to_ca',
      'update_required',
      'approved',
      'completed',
      'cancelled',
    ],
    submitted_to_ca: [
      'applied',
      'in_progress',
      'approved',
      'cancelled',
      'completed',
    ],
    approved: [
      'applied',
      'submitted_to_ca',
      'in_progress',
      'under_review',
      'completed',
    ],
    completed: [
      'applied',
      'approved',
      'submitted_to_ca',
      'in_progress',
      'under_review',
    ],
    cancelled: ['applied'],
    rejected: ['applied'],
  };

  private static readonly KNOWN_STATUSES = new Set(
    Object.keys(UserServicesService.STATUS_FLOW),
  );

  private static readonly STATUS_TO_WORKFLOW_STAGE_SLUGS: Record<
    string,
    string[]
  > = {
    applied: ['payment-verification', 'start'],
    paid: ['payment-verification', 'start'],
    payment_pending: ['payment-verification', 'start'],
    in_cart: ['payment-verification', 'start'],
    under_review: ['start', 'verification', 'review'],
    update_required: ['start', 'verification', 'review'],
    in_progress: ['review', 'verification', 'start'],
    submitted_to_ca: [
      'department-submission',
      'start',
      'review',
      'verification',
    ],
    approved: ['completed', 'complete'],
    completed: ['completed', 'complete'],
    cancelled: ['cancelled', 'canceled', 'cancel'],
    rejected: ['start'],
  };

  private static readonly WORKFLOW_STAGE_SLUG_TO_STATUS: Record<
    string,
    string
  > = {
    'payment-verification': 'paid',
    start: 'under_review',
    verification: 'under_review',
    review: 'in_progress',
    'department-submission': 'submitted_to_ca',
    completed: 'completed',
    complete: 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    cancel: 'cancelled',
  };

  canTransitionTo(current: string, next: string): boolean {
    const normalizedCurrent = String(current || '')
      .trim()
      .toLowerCase();
    const normalizedNext = String(next || '')
      .trim()
      .toLowerCase();

    if (normalizedCurrent === normalizedNext) return true;
    const allowed = UserServicesService.STATUS_FLOW[normalizedCurrent] || [];
    return allowed.includes(normalizedNext);
  }

  private async getWorkflowIdForStatus(
    serviceId: number,
    status: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<number | null> {
    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase();
    const candidateSlugs =
      UserServicesService.STATUS_TO_WORKFLOW_STAGE_SLUGS[normalizedStatus] ??
      [];

    if (candidateSlugs.length === 0) {
      return null;
    }

    const workflows = await client.serviceWorkflow.findMany({
      where: {
        serviceId,
        stage: {
          isActive: true,
        },
      },
      include: {
        stage: true,
      },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    for (const slug of candidateSlugs) {
      const match = workflows.find(
        (workflow) =>
          String(workflow.stage?.slug || '')
            .trim()
            .toLowerCase() === slug,
      );

      if (match) {
        return Number(match.id);
      }
    }

    return null;
  }

  private getStatusForWorkflowStageSlug(stageSlug: string | null | undefined) {
    const normalizedSlug = String(stageSlug || '')
      .trim()
      .toLowerCase();
    const status =
      UserServicesService.WORKFLOW_STAGE_SLUG_TO_STATUS[normalizedSlug];
    if (status) {
      return status;
    }
    // Return 'in_progress' for intermediate custom workflow stages
    return 'in_progress';
  }

  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusInput,
  ) {
    const normalizedStatus = String(data.status || '')
      .trim()
      .toLowerCase();

    const userService = await this.prisma.userService.findUniqueOrThrow({
      where: { id },
    });

    if (!this.canTransitionTo(userService.status, normalizedStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${userService.status} to ${normalizedStatus}`,
      );
    }

    const updateData: any = { status: normalizedStatus };
    if (data.ca_notes !== undefined) {
      updateData.caNotes = this.normalizeNullableText(data.ca_notes);
    }
    if (data.update_note !== undefined) {
      updateData.updateNote = this.normalizeNullableText(data.update_note);
    }
    if (data.rejection_reason !== undefined) {
      updateData.rejectionReason = this.normalizeNullableText(
        data.rejection_reason,
      );
    }
    if (data.client_message !== undefined) {
      updateData.clientMessage = this.normalizeNullableText(
        data.client_message,
      );
    } else {
      const defaultClientMessage =
        this.defaultClientMessageForStatus(normalizedStatus);
      if (defaultClientMessage !== undefined) {
        updateData.clientMessage = defaultClientMessage;
      }
    }
    if (data.certificate_url) {
      updateData.certificateUrl = data.certificate_url;
    }

    if (normalizedStatus === 'approved') {
      updateData.verified = true;
      if (!userService.certificateUrl && !data.certificate_url) {
        throw new BadRequestException(
          'Certificate URL is required for approval',
        );
      }
    }

    this.applyStatusSideEffects(updateData, normalizedStatus);

    await this.prisma.$transaction(async (tx) => {
      const matchingWorkflowId = await this.getWorkflowIdForStatus(
        Number(userService.serviceId),
        normalizedStatus,
        tx,
      );

      if (matchingWorkflowId !== null) {
        updateData.currentServiceWorkflowId = matchingWorkflowId;
        updateData.currentStageUpdatedAt = new Date();
      }

      await tx.userService.update({
        where: { id },
        data: updateData,
      });
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated);
  }

  async overrideApplicationStatus(
    id: number,
    data: UpdateApplicationStatusInput,
  ) {
    id = this.normalizeInteger(id, 'application_id');
    const normalizedStatus = String(data.status || '')
      .trim()
      .toLowerCase();

    if (!UserServicesService.KNOWN_STATUSES.has(normalizedStatus)) {
      throw new BadRequestException('Invalid status selected');
    }

    const userService = await this.prisma.userService.findUniqueOrThrow({
      where: { id },
    });

    const updateData: any = { status: normalizedStatus };
    if (data.ca_notes !== undefined) {
      updateData.caNotes = this.normalizeNullableText(data.ca_notes);
    }
    if (data.update_note !== undefined) {
      updateData.updateNote = this.normalizeNullableText(data.update_note);
    }
    if (data.rejection_reason !== undefined) {
      updateData.rejectionReason = this.normalizeNullableText(
        data.rejection_reason,
      );
    }
    if (data.client_message !== undefined) {
      updateData.clientMessage = this.normalizeNullableText(
        data.client_message,
      );
    } else {
      const defaultClientMessage =
        this.defaultClientMessageForStatus(normalizedStatus);
      if (defaultClientMessage !== undefined) {
        updateData.clientMessage = defaultClientMessage;
      }
    }
    if (data.certificate_url) {
      updateData.certificateUrl = data.certificate_url;
    }

    this.applyStatusSideEffects(updateData, normalizedStatus);

    await this.prisma.$transaction(async (tx) => {
      const matchingWorkflowId = await this.getWorkflowIdForStatus(
        Number(userService.serviceId),
        normalizedStatus,
        tx,
      );

      if (matchingWorkflowId !== null) {
        updateData.currentServiceWorkflowId = matchingWorkflowId;
        updateData.currentStageUpdatedAt = new Date();
      } else if (
        ['in_cart', USER_SERVICE_PAYMENT_PENDING_STATUS].includes(
          normalizedStatus,
        )
      ) {
        updateData.currentServiceWorkflowId = null;
        updateData.currentStageUpdatedAt = null;
      }

      await tx.userService.update({
        where: { id },
        data: updateData,
      });
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated);
  }

  // Document Verification
  async verifyDocument(
    userServiceId: number,
    docId: number,
    status: 'verified' | 'rejected',
    notes?: string,
  ) {
    const userService = (await this.prisma.userService.findUniqueOrThrow({
      where: { id: userServiceId },
      include: {
        service: { include: { category: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    const document = (await this.prisma.serviceRequestDocument.findFirst({
      where: { id: docId, userServiceId },
      include: { uploadedBy: true },
    })) as any;
    if (!document) {
      throw new NotFoundException('Document not found in this request');
    }

    await this.prisma.serviceRequestDocument.update({
      where: { id: docId },
      data: { status, notes: notes || undefined },
    });

    // If any document is rejected, potentially move the whole application to 'update_required'
    if (status === 'rejected' && userService.status === 'under_review') {
      await this.prisma.userService.update({
        where: { id: userServiceId },
        data: {
          clientMessage: document.documentName
            ? `Please update the document: ${document.documentName}.`
            : 'Please upload the requested document updates.',
          status: 'update_required',
          updateNote: `Document '${document.documentName}' was rejected: ${notes}`,
        },
      });
    }

    userService.requestDocuments = [document];
    await this.populateRequestDocuments(userService);
    await this.populateLatestPayments(userService);
    await this.populateStageProgress(userService);

    return toUserServiceResource(userService);
  }

  async markVerified(id: number, verified: boolean) {
    await this.prisma.userService.update({
      where: { id },
      data: { verified },
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id },
      include: {
        service: { include: { category: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated);
  }

  async getAccountantServices(accountantId: number) {
    const services = (await this.prisma.userService.findMany({
      where: {
        accountantId,
        paymentStatus: {
          in: getPaidPaymentStatusValues(),
        },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      include: {
        service: { include: { category: true } },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as any[];

    await this.populateRequestDocuments(services);
    await this.populateLatestPayments(services);
    await this.populateStageProgress(services);

    return services.map((service) => toUserServiceResource(service));
  }

  async getRmServices(rmId: number) {
    // Logic to get services for users connected to this RM
    const services = (await this.prisma.userService.findMany({
      where: {
        paymentStatus: {
          in: getPaidPaymentStatusValues(),
        },
        user: { rmId },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      include: {
        service: { include: { category: true } },
        user: true,
        accountant: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as any[];

    await this.populateRequestDocuments(services);
    await this.populateLatestPayments(services);
    await this.populateStageProgress(services);

    return services.map((service) => toUserServiceResource(service));
  }

  async assignAccountantToService(userServiceId: number, accountantId: number) {
    await this.prisma.userService.update({
      where: { id: userServiceId },
      data: { accountantId },
    });

    const hydrated = (await this.prisma.userService.findUniqueOrThrow({
      where: { id: userServiceId },
      include: {
        service: { include: { category: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(hydrated);
    await this.populateLatestPayments(hydrated);
    await this.populateStageProgress(hydrated);

    return toUserServiceResource(hydrated);
  }

  async populateStageProgress<T extends any | any[]>(input: T): Promise<T> {
    const services = Array.isArray(input) ? input : [input];

    if (services.length === 0) {
      return input;
    }

    const serviceIds = [
      ...new Set(
        services
          .map((service) => Number(service.serviceId ?? service.service?.id))
          .filter((serviceId) => Number.isFinite(serviceId)),
      ),
    ];
    const currentStageIds = [
      ...new Set(
        services
          .map((service) => Number(service.currentServiceWorkflowId))
          .filter((stageId) => Number.isFinite(stageId) && stageId > 0),
      ),
    ];

    if (serviceIds.length === 0) {
      services.forEach((service) => {
        service.currentWorkflow = null;
        if (service.service) {
          service.service.serviceWorkflows = [];
        }
      });
      return input;
    }

    const [serviceWorkflows, referencedWorkflows] = await Promise.all([
      this.prisma.serviceWorkflow.findMany({
        where: {
          serviceId: { in: serviceIds },
          stage: {
            isActive: true,
          },
        },
        include: {
          stage: true,
        },
        orderBy: [{ serviceId: 'asc' }, { position: 'asc' }, { id: 'asc' }],
      }),
      currentStageIds.length === 0
        ? Promise.resolve([])
        : this.prisma.serviceWorkflow.findMany({
            where: {
              id: { in: currentStageIds },
            },
            include: {
              stage: true,
            },
          }),
    ]);

    const workflowMapByServiceId = new Map<number, any[]>();
    const workflowMapById = new Map<number, any>();

    for (const workflow of [...serviceWorkflows, ...referencedWorkflows]) {
      workflowMapById.set(Number(workflow.id), workflow);
    }

    for (const workflow of serviceWorkflows) {
      const key = Number(workflow.serviceId);
      const existing = workflowMapByServiceId.get(key);
      if (existing) {
        existing.push(workflow);
      } else {
        workflowMapByServiceId.set(key, [workflow]);
      }
    }

    services.forEach((service) => {
      const serviceId = Number(service.serviceId ?? service.service?.id);
      const currentWorkflowId = Number(service.currentServiceWorkflowId);
      const allServiceWorkflows = workflowMapByServiceId.get(serviceId) ?? [];
      const resolvedCurrentWorkflow =
        workflowMapById.get(currentWorkflowId) ??
        service.currentWorkflow ??
        null;
      const workflowView = this.resolveWorkflowViewForService(
        allServiceWorkflows,
        resolvedCurrentWorkflow,
        service.status,
      );

      service.currentWorkflow = workflowView.currentWorkflow;
      if (!service.service) {
        service.service = { id: serviceId };
      }
      service.service.serviceWorkflows = workflowView.workflows;

      const activeWorkflowsForCheck = workflowView.workflows.filter(
        (workflow) =>
          Number(workflow.position) > 0 && Number(workflow.position) < 1000,
      );
      if (activeWorkflowsForCheck.length === 0) {
        service.hasWorkflow = false;
        service.isCustomWorkflow = false;
      } else {
        service.hasWorkflow = true;
        service.isCustomWorkflow = Boolean(service.service?.hasCustomWorkflow);
      }
    });

    return input;
  }

  private resolveWorkflowViewForService(
    workflows: any[],
    currentWorkflow: any,
    status: unknown,
  ) {
    const activeWorkflows = this.sortWorkflowStages(
      workflows.filter((workflow) => {
        const position = Number(workflow?.position);
        return Number.isFinite(position) && position > 0 && position < 1000;
      }),
    );

    if (
      !currentWorkflow ||
      !this.isClosedUserServiceStatus(status) ||
      Number(currentWorkflow?.position) < 1000
    ) {
      return {
        currentWorkflow,
        workflows: activeWorkflows,
      };
    }

    const archiveBlock = this.resolveWorkflowArchiveBlock(
      Number(currentWorkflow.position),
    );

    if (archiveBlock === 0) {
      return {
        currentWorkflow,
        workflows: activeWorkflows,
      };
    }

    const archivedWorkflows = this.sortWorkflowStages(
      workflows
        .filter(
          (workflow) =>
            this.resolveWorkflowArchiveBlock(Number(workflow?.position)) ===
            archiveBlock,
        )
        .map((workflow) => ({
          ...workflow,
          position: Number(workflow.position) - archiveBlock,
        })),
    );

    if (archivedWorkflows.length === 0) {
      return {
        currentWorkflow,
        workflows: activeWorkflows,
      };
    }

    return {
      currentWorkflow: archivedWorkflows.find(
        (workflow) => Number(workflow.id) === Number(currentWorkflow.id),
      ) ?? {
        ...currentWorkflow,
        position: Number(currentWorkflow.position) - archiveBlock,
      },
      workflows: archivedWorkflows,
    };
  }

  private resolveWorkflowArchiveBlock(position: number) {
    if (!Number.isFinite(position) || position < 1000) {
      return 0;
    }

    return Math.floor(position / 1000) * 1000;
  }

  private sortWorkflowStages<T extends { id?: number; position?: number }>(
    workflows: T[],
  ) {
    return [...workflows].sort(
      (left, right) =>
        Number(left.position ?? 0) - Number(right.position ?? 0) ||
        Number(left.id ?? 0) - Number(right.id ?? 0),
    );
  }

  private isClosedUserServiceStatus(status: unknown) {
    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase();
    return CLOSED_USER_SERVICE_STATUSES.has(normalizedStatus);
  }

  async populateLatestPayments<T extends any | any[]>(input: T): Promise<T> {
    const services = Array.isArray(input) ? input : [input];

    if (services.length === 0) {
      return input;
    }

    const serviceIds = [
      ...new Set(
        services
          .map((service) => Number(service.id))
          .filter((serviceId) => Number.isFinite(serviceId)),
      ),
    ];
    const userIds = [
      ...new Set(
        services
          .map((service) => Number(service.userId))
          .filter((userId) => Number.isFinite(userId)),
      ),
    ];

    if (serviceIds.length === 0 || userIds.length === 0) {
      services.forEach((service) => {
        service.latestPayment = null;
      });
      return input;
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        OR: [
          { userServiceId: { in: serviceIds } },
          { userId: { in: userIds } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const targetServiceIds = new Set(serviceIds);
    const latestPaymentsByServiceId = new Map<number, any>();

    for (const payment of payments) {
      const linkedServiceIds = this.resolvePaymentLinkedServiceIds(payment);

      for (const serviceId of linkedServiceIds) {
        if (!targetServiceIds.has(serviceId)) {
          continue;
        }

        if (!latestPaymentsByServiceId.has(serviceId)) {
          latestPaymentsByServiceId.set(serviceId, payment);
        }
      }
    }

    services.forEach((service) => {
      service.latestPayment =
        latestPaymentsByServiceId.get(Number(service.id)) ?? null;
    });

    return input;
  }

  async populateRequestDocuments<T extends any | any[]>(input: T): Promise<T> {
    const services = Array.isArray(input) ? input : [input];

    if (services.length === 0) {
      return input;
    }

    const serviceIds = services
      .map((service) => Number(service.id))
      .filter((serviceId) => Number.isFinite(serviceId));

    if (serviceIds.length === 0) {
      services.forEach((service) => {
        service.requestDocuments = [];
      });
      return input;
    }

    try {
      const documents = await this.prisma.serviceRequestDocument.findMany({
        where: { userServiceId: { in: serviceIds } },
        include: { uploadedBy: true },
        orderBy: { createdAt: 'asc' },
      });

      const documentsByServiceId = new Map<number, any[]>();

      for (const document of documents) {
        const key = Number(document.userServiceId);
        const existing = documentsByServiceId.get(key);
        if (existing) {
          existing.push(document);
          continue;
        }

        documentsByServiceId.set(key, [document]);
      }

      services.forEach((service) => {
        service.requestDocuments =
          documentsByServiceId.get(Number(service.id)) ?? [];
      });
    } catch (error) {
      if (!this.isRecoverableRequestDocumentsQueryError(error)) {
        throw error;
      }

      console.warn(
        '[UserServicesService] Request-document hydration failed; continuing with empty request_documents.',
        error,
      );

      services.forEach((service) => {
        service.requestDocuments = [];
      });
    }

    return input;
  }

  private resolvePaymentLinkedServiceIds(payment: any) {
    const cartItemIds = Array.isArray(payment.notes?.cart_item_ids)
      ? payment.notes.cart_item_ids
      : [];
    const serviceIds = [...cartItemIds, payment.userServiceId].filter(
      (value): value is number => Number.isInteger(Number(value)),
    );

    return [...new Set(serviceIds.map((value) => Number(value)))];
  }

  private sortByLatestOrderFirst(services: any[]) {
    services.sort((left, right) => {
      const rightDate = this.resolveServiceSortTimestamp(right);
      const leftDate = this.resolveServiceSortTimestamp(left);

      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      return Number(right.id) - Number(left.id);
    });
  }

  private resolveServiceSortTimestamp(service: any) {
    const primaryDate = service.latestPayment?.createdAt ?? service.createdAt;
    const timestamp = new Date(primaryDate).getTime();

    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private isRecoverableRequestDocumentsQueryError(error: any) {
    const message = String(error.message || '').toLowerCase();

    return (
      message.includes('service_request_documents') ||
      message.includes('uploaded_by') ||
      message.includes('source_document_id') ||
      message.includes('document_category') ||
      message.includes('document_name') ||
      message.includes('requestdocuments')
    );
  }

  private normalizeInteger(value: number | string, fieldName: string) {
    const parsed =
      typeof value === 'number' ? value : Number(String(value).trim());

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }

    return parsed;
  }

  private normalizeRequiredText(value: unknown, fieldName: string) {
    const normalized = String(value ?? '').trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalized;
  }

  private normalizeNullableText(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
  }

  private applyStatusSideEffects(
    updateData: Record<string, any>,
    status: string,
  ) {
    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase();

    if (['approved', 'completed'].includes(normalizedStatus)) {
      updateData.verified = true;
    }

    if (normalizedStatus === 'submitted_to_ca') {
      updateData.submittedToCaAt = new Date();
    }
  }

  private defaultClientMessageForStatus(status: string) {
    switch (String(status).toLowerCase()) {
      case 'update_required':
        return 'Additional information or documents are required.';
      case 'approved':
        return 'Your service request has been approved.';
      case 'completed':
        return 'Your service request has been completed.';
      case 'rejected':
        return 'Your service request could not be completed.';
      default:
        return undefined;
    }
  }
}
