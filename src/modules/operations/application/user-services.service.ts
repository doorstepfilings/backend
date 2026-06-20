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

export type UpdateApplicationStatusInput = {
  status: string;
  ca_notes?: string;
  certificate_url?: string;
  rejection_reason?: string;
  update_note?: string;
};

export type ClientDocumentApprovalInput = {
  action?: string;
  client_approval_status?: string;
  correction_note?: string;
  note?: string;
  remark?: string;
  status?: string;
};

const NOTE_AUTHOR_PATTERN =
  /^(Accountant|Admin|Super_Admin|SuperAdmin|Super\s+Admin|You|User|Client|System)(?:\s*\(.*?\))?:/i;

@Injectable()
export class UserServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotsService: SlotsService,
    private readonly documentUploadService: DocumentUploadService,
  ) { }

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
    this.sortByLatestOrderFirst(services);

    return services.map((service) =>
      toUserServiceResource(service, {
        includeInternalDocuments: false,
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
          accountantId: userService.accountantId ?? user.accountantId,
        },
      });
    } else {
      userService = await this.prisma.userService.create({
        data: {
          userId,
          serviceId: dto.service_id,
          accountantId: user.accountantId,
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

    return toUserServiceResource(hydrated, {
      includeInternalDocuments: false,
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
      const statusLabel = UserServicesService.STATUS_LABELS[userService.status] || userService.status;
      throw new BadRequestException(
        `You cannot upload documents while the application is in the '${statusLabel}' stage.`,
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

    return toUserServiceResource(refreshed, {
      includeInternalDocuments: false,
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

    const removableStatuses = [
      'draft',
      'applied',
      'in_cart',
      USER_SERVICE_PAYMENT_PENDING_STATUS,
    ];

    if (!removableStatuses.includes(userService.status)) {
      throw new BadRequestException('Only draft or newly submitted applications can be removed.');
    }

    const payments = await this.prisma.payment.findMany({
      where: { userServiceId: userService.id },
    });

    const hasCompletedPayment = payments.some((payment) =>
      isSettledPaymentRecord(payment),
    );

    if (hasCompletedPayment) {
      throw new BadRequestException('You cannot remove a service application that has already been paid for.');
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
      const statusLabel = UserServicesService.STATUS_LABELS[userService.status] || userService.status;
      throw new BadRequestException(
        `Documents cannot be deleted while the application is in the '${statusLabel}' stage.`,
      );
    }

    await this.documentUploadService.deleteDocument(docId, userId);

    return true;
  }

  async getAllServices(
    status?: string,
    applicationDate?: string,
    timezoneOffsetMinutes = 0,
  ) {
    const createdAt = this.resolveApplicationDateFilter(
      applicationDate,
      timezoneOffsetMinutes,
    );
    const services = (await this.prisma.userService.findMany({
      where: {
        ...buildAdminApplicationWhere(status),
        ...(createdAt ? { createdAt } : {}),
      },
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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })) as any[];

    await this.populateRequestDocuments(services);
    await this.populateLatestPayments(services);

    return services.map((service) => toUserServiceResource(service));
  }

  private resolveApplicationDateFilter(
    applicationDate?: string,
    timezoneOffsetMinutes = 0,
  ) {
    if (!applicationDate) {
      return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(applicationDate);
    if (!match) {
      throw new BadRequestException(
        'Application date must use YYYY-MM-DD format',
      );
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const utcDate = new Date(Date.UTC(year, month - 1, day));

    if (
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== month - 1 ||
      utcDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('Application date is invalid');
    }

    if (
      !Number.isFinite(timezoneOffsetMinutes) ||
      timezoneOffsetMinutes < -840 ||
      timezoneOffsetMinutes > 840
    ) {
      throw new BadRequestException('Timezone offset is invalid');
    }

    const start = new Date(
      Date.UTC(year, month - 1, day) + timezoneOffsetMinutes * 60_000,
    );
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return {
      gte: start,
      lt: end,
    };
  }

  // Status State Machine
  private static readonly STATUS_FLOW: Record<string, string[]> = {
    draft: ['applied', 'payment_pending', 'cancelled'],
    in_cart: ['applied', 'payment_pending', 'cancelled', 'draft'], // legacy
    payment_pending: ['paid', 'cancelled', 'applied'],
    paid: ['applied', 'document_collection', 'under_review', 'cancelled'],
    applied: ['document_collection', 'under_review', 'completed', 'cancelled', 'rejected', 'approved'],
    pending: ['applied', 'document_collection', 'under_review', 'cancelled', 'rejected', 'approved'], // legacy
    document_collection: ['under_review', 'update_required', 'cancelled', 'approved'],
    under_review: ['update_required', 'in_progress', 'document_collection', 'completed', 'cancelled', 'rejected', 'approved'],
    update_required: ['under_review', 'document_collection', 'cancelled', 'approved'],
    revision_requested: ['under_review', 'update_required', 'cancelled', 'approved'], // legacy
    in_progress: ['under_review', 'completed', 'cancelled', 'rejected', 'update_required', 'approved'],
    processing: ['in_progress', 'completed', 'cancelled', 'approved'], // legacy
    submitted_to_ca: ['under_review', 'in_progress', 'completed', 'applied', 'document_collection', 'update_required', 'cancelled', 'approved'], // legacy escape hatch
    approved: ['completed', 'in_progress', 'under_review', 'update_required'],
    completed: ['approved', 'in_progress', 'under_review', 'update_required'],
    cancelled: ['applied', 'draft'],
    rejected: ['applied', 'draft'],
  };

  static readonly STATUS_LABELS: Record<string, string> = {
    in_cart: 'In Cart',
    payment_pending: 'Payment Pending',
    paid: 'Paid',
    applied: 'Initial Submission',
    pending: 'Pending',
    document_collection: 'Document Collection',
    under_review: 'Verification Stage',
    update_required: 'Correction Required',
    revision_requested: 'Revision Requested',
    in_progress: 'Processing Stage',
    processing: 'Processing',
    submitted_to_ca: 'Submitted to CA',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };

  canTransitionTo(current: string, next: string): boolean {
    if (current === next) return true;
    const allowed = UserServicesService.STATUS_FLOW[current] || [];
    return allowed.includes(next);
  }

  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusInput,
  ) {
    const userService = await this.prisma.userService.findUniqueOrThrow({
      where: { id },
    });

    if (!this.canTransitionTo(userService.status, data.status)) {
      const currentLabel = UserServicesService.STATUS_LABELS[userService.status] || userService.status;
      const nextLabel = UserServicesService.STATUS_LABELS[data.status] || data.status;
      
      let friendlyMessage = `Cannot change application status from '${currentLabel}' to '${nextLabel}'.`;
      
      if (userService.status === 'update_required') {
        friendlyMessage = `This application is currently waiting for client corrections. You cannot approve, complete, or process it until the client submits the requested updates.`;
      } else if (userService.status === 'completed') {
        friendlyMessage = `This application has already been Completed and finalized. Its status cannot be updated.`;
      } else if (userService.status === 'cancelled') {
        friendlyMessage = `This application has been Cancelled and cannot be updated.`;
      } else if (userService.status === 'rejected') {
        friendlyMessage = `This application has been Rejected and cannot be updated.`;
      } else {
        const allowedNext = UserServicesService.STATUS_FLOW[userService.status] || [];
        const allowedLabels = allowedNext.map(status => `'${UserServicesService.STATUS_LABELS[status] || status}'`);
        
        if (allowedLabels.length === 0) {
          friendlyMessage = `This application is currently in the '${currentLabel}' stage and cannot be moved to any other stage.`;
        } else if (allowedLabels.length === 1) {
          friendlyMessage = `This application is currently in the '${currentLabel}' stage. At this point, the only allowed next step is to move it to ${allowedLabels[0]}.`;
        } else {
          friendlyMessage = `This application is currently in the '${currentLabel}' stage. From here, you can only transition it to one of the following stages: ${allowedLabels.join(', ')}.`;
        }
      }

      throw new BadRequestException(friendlyMessage);
    }

    const updateData: any = { status: data.status };
    if (data.ca_notes) updateData.caNotes = data.ca_notes;
    if (data.update_note) updateData.updateNote = data.update_note;
    if (data.rejection_reason)
      updateData.rejectionReason = data.rejection_reason;
    if (data.certificate_url) updateData.certificateUrl = data.certificate_url;

    if (data.status === 'approved') {
      updateData.verified = true;
      if (!userService.certificateUrl && !data.certificate_url) {
        throw new BadRequestException(
          'A final certificate or document must be uploaded before the application can be approved.',
        );
      }
    } else if (['in_progress', 'under_review', 'update_required', 'document_collection', 'applied', 'pending', 'revision_requested'].includes(data.status)) {
      updateData.verified = false;
    }

    await this.prisma.userService.update({
      where: { id },
      data: updateData,
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

    const documentType = String(document.documentType || '').toLowerCase();
    const uploaderRole = String(document.uploadedBy?.role || '').toLowerCase();
    const documentStatus = String(document.status || '').toLowerCase();
    const isApprovedClientDelivery =
      ['client', 'client_document'].includes(documentType) &&
      [
        'accountant',
        'admin',
        'super_admin',
        'regional_manager',
        'rm',
        'employee',
      ].includes(uploaderRole) &&
      ['approved', 'verified'].includes(documentStatus);

    if (isApprovedClientDelivery) {
      throw new BadRequestException(
        'Client-approved documents are read-only',
      );
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
          status: 'update_required',
          updateNote: `Document '${document.documentName}' was rejected: ${notes}`,
        },
      });
    }

    userService.requestDocuments = [document];
    await this.populateRequestDocuments(userService);
    await this.populateLatestPayments(userService);

    return toUserServiceResource(userService);
  }

  async respondToDocumentClientApproval(
    userId: number,
    userServiceId: number,
    docId: number,
    data: ClientDocumentApprovalInput,
  ) {
    const userService = (await this.prisma.userService.findFirst({
      where: { id: userServiceId, userId },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    if (!userService) {
      throw new NotFoundException('Service request not found');
    }

    const document = (await this.prisma.serviceRequestDocument.findFirst({
      where: { id: docId, userServiceId },
      include: { uploadedBy: true },
    })) as any;

    if (!document) {
      throw new NotFoundException('Document not found in this request');
    }

    if (String(document.uploadedById) === String(userId)) {
      throw new BadRequestException(
        'You cannot approve your own uploaded document',
      );
    }

    const documentType = String(document.documentType || '').toLowerCase();
    if (!['client', 'client_document'].includes(documentType)) {
      throw new BadRequestException(
        'Only client-visible documents can be approved by the client',
      );
    }

    const approvalStatus = this.resolveClientApprovalStatus(data);
    const note = this.formatClientApprovalNote(
      this.resolveClientApprovalNote(data),
      userService.user?.name,
    );

    if (approvalStatus === 'rejected' && !note) {
      throw new BadRequestException('Correction note is required');
    }

    const notes = note
      ? this.appendDocumentNote(document.notes, note)
      : undefined;

    await this.prisma.serviceRequestDocument.update({
      where: { id: docId },
      data: {
        status: approvalStatus,
        ...(notes ? { notes } : {}),
      },
    });

    const refreshed = (await this.prisma.userService.findUniqueOrThrow({
      where: { id: userServiceId },
      include: {
        service: { include: { category: true, documents: true } },
        user: true,
        accountant: true,
      },
    })) as any;

    await this.populateRequestDocuments(refreshed);
    await this.populateLatestPayments(refreshed);

    return toUserServiceResource(refreshed, {
      includeInternalDocuments: false,
      ownerUserId: userId,
    });
  }

  private resolveClientApprovalStatus(data: ClientDocumentApprovalInput) {
    const rawStatus = String(
      data.client_approval_status ?? data.action ?? data.status ?? '',
    ).toLowerCase();

    if (['approved', 'approve', 'verified', 'verify'].includes(rawStatus)) {
      return 'approved' as const;
    }

    if (
      [
        'correction',
        'correction_requested',
        'changes_requested',
        'rejected',
        'reject',
      ].includes(rawStatus)
    ) {
      return 'rejected' as const;
    }

    throw new BadRequestException('Invalid document approval action');
  }

  private resolveClientApprovalNote(data: ClientDocumentApprovalInput) {
    const note = data.correction_note ?? data.note ?? data.remark;
    return typeof note === 'string' ? note.trim() : '';
  }

  private formatClientApprovalNote(note: string, clientName?: string | null) {
    if (!note) return '';
    if (NOTE_AUTHOR_PATTERN.test(note)) return note;
    return clientName ? `Client (${clientName}): ${note}` : `Client: ${note}`;
  }

  private appendDocumentNote(existingNote: unknown, nextNote: string) {
    const existing =
      typeof existingNote === 'string' && existingNote.trim()
        ? existingNote.trim()
        : '';

    if (!existing) return nextNote;
    if (existing.split('\n\n').some((entry) => entry.trim() === nextNote)) {
      return existing;
    }

    return `${existing}\n\n${nextNote}`;
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

    return toUserServiceResource(hydrated);
  }

  async getAccountantServices(accountantId: number) {
    return (await this.prisma.userService.findMany({
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
  }

  async getRmServices(rmId: number) {
    // Logic to get services for users connected to this RM
    return (await this.prisma.userService.findMany({
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

    return toUserServiceResource(hydrated);
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
      (service as any).latestPayment =
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
        (service as any).requestDocuments =
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
        (service as any).requestDocuments = [];
      });
    }

    return input;
  }

  private resolvePaymentLinkedServiceIds(payment: any) {
    const cartItemIds = Array.isArray((payment.notes as any)?.cart_item_ids)
      ? (payment.notes as any).cart_item_ids
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
}
