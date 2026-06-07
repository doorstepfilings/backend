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
    this.sortByLatestOrderFirst(services);

    return services.map((service) => toUserServiceResource(service));
  }

  // Status State Machine
  private static readonly STATUS_FLOW: Record<string, string[]> = {
    draft: ['applied', 'payment_pending', 'cancelled'],
    in_cart: ['applied', 'payment_pending', 'cancelled', 'draft'], // legacy
    payment_pending: ['paid', 'cancelled', 'applied'],
    paid: ['applied', 'document_collection', 'under_review', 'cancelled'],
    applied: ['document_collection', 'under_review', 'completed', 'cancelled', 'rejected'],
    pending: ['applied', 'document_collection', 'under_review', 'cancelled', 'rejected'], // legacy
    document_collection: ['under_review', 'update_required', 'cancelled'],
    under_review: ['update_required', 'in_progress', 'document_collection', 'completed', 'cancelled', 'rejected'],
    update_required: ['under_review', 'document_collection', 'cancelled'],
    revision_requested: ['under_review', 'update_required', 'cancelled'], // legacy
    in_progress: ['under_review', 'completed', 'cancelled', 'rejected', 'update_required'],
    processing: ['in_progress', 'completed', 'cancelled'], // legacy
    submitted_to_ca: ['under_review', 'in_progress', 'completed', 'applied', 'document_collection', 'update_required', 'cancelled'], // legacy escape hatch
    approved: ['completed'], // legacy
    completed: [],
    cancelled: ['applied', 'draft'],
    rejected: ['applied', 'draft'],
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
      throw new BadRequestException(
        `Invalid status transition from ${userService.status} to ${data.status}`,
      );
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
          'Certificate URL is required for approval',
        );
      }
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
