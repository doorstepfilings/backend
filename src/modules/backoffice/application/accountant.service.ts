import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toUserResource } from '../../identity/application/identity.mapper';
import { toUserServiceResource } from '../../operations/application/operations.mapper';
import { UserServicesService, UpdateApplicationStatusInput } from '../../operations/application/user-services.service';
import {
  getPaidPaymentStatusValues,
  HIDDEN_USER_SERVICE_STATUSES,
} from '../../operations/application/payment-status';
import {
  DocumentUploadService,
  type UploadedDocumentFile,
} from '../../operations/application/document-upload.service';
import { NotificationService } from '../../communication/notification.service';

@Injectable()
export class AccountantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userServicesService: UserServicesService,
    private readonly documentUploadService: DocumentUploadService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAssignedUsers(accountantId: number) {
    const users = (await this.prisma.user.findMany({
      where: {
        role: 'user',
        OR: [
          { accountantId },
          {
            userServices: {
              some: {
                accountantId,
              },
            },
          },
        ],
      },
      include: {
        regionalManager: true,
        accountant: true,
      },
      orderBy: { name: 'asc' },
    })) as any[];

    if (users.length === 0) return [];

    // Fetch services for all these users in one query
    const userIds = users.map((u) => u.id);
    const allServices = await this.prisma.userService.findMany({
      where: { userId: { in: userIds } },
      include: { service: true },
    });

    // Group services by userId
    const servicesMap = new Map<number, any[]>();
    allServices.forEach((s) => {
      if (!servicesMap.has(Number(s.userId))) {
        servicesMap.set(Number(s.userId), []);
      }
      servicesMap.get(Number(s.userId))?.push(s);
    });

    return users.map((user) => {
      (user as any).services = servicesMap.get(user.id) || [];
      return toUserResource(user);
    });
  }

  async getUserById(accountantId: number, id: number) {
    const user = (await this.prisma.user.findFirst({
      where: {
        id,
        role: 'user',
        OR: [
          { accountantId },
          {
            userServices: {
              some: {
                accountantId,
              },
            },
          },
        ],
      },
      include: {
        regionalManager: true,
        accountant: true,
      },
    })) as any;

    if (!user) throw new NotFoundException('Client not found');

    // Fetch all services for this user
    const services = await this.prisma.userService.findMany({
      where: {
        userId: id,
        paymentStatus: { in: getPaidPaymentStatusValues() },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      include: { service: true },
      orderBy: { updatedAt: 'desc' },
    });

    (user as any).services = services;
    return toUserResource(user);
  }

  async listRequests(accountantId: number, status?: string) {
    const where: any = {
      OR: [
        { accountantId },
        {
          user: {
            accountantId,
          },
        },
      ],
    };
    if (status) {
      where.status = status;
    } else {
      where.status = {
        notIn: [
          ...HIDDEN_USER_SERVICE_STATUSES,
        ],
      };
      where.paymentStatus = { in: getPaidPaymentStatusValues() };
    }

    const requests = (await this.prisma.userService.findMany({
      where,
      include: {
        user: true,
        service: { include: { category: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })) as any[];

    await this.userServicesService.populateRequestDocuments(requests);
    await this.userServicesService.populateLatestPayments(requests);

    return requests.map((request) => toUserServiceResource(request));
  }

  async showRequest(accountantId: number, id: number) {
    const request = (await this.prisma.userService.findFirst({
      where: {
        id,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
      include: {
        user: true,
        service: { include: { category: true } },
      },
    })) as any;

    if (!request) throw new NotFoundException('Service request not found');
    await this.userServicesService.populateRequestDocuments(request);
    await this.userServicesService.populateLatestPayments(request);
    return toUserServiceResource(request);
  }

  async updateStatus(
    accountantId: number,
    id: number,
    data: UpdateApplicationStatusInput,
  ) {
    await this.prisma.userService.findFirstOrThrow({
      where: {
        id,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
    });

    return this.userServicesService.updateApplicationStatus(id, data);
  }

  async verifyDocument(
    accountantId: number,
    userServiceId: number,
    docId: number,
    status: 'verified' | 'rejected',
    notes?: string,
  ) {
    await this.prisma.userService.findFirstOrThrow({
      where: {
        id: userServiceId,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
    });

    return this.userServicesService.verifyDocument(
      userServiceId,
      docId,
      status,
      notes,
    );
  }

  async listDocuments(accountantId: number, requestId: number) {
    await this.showRequest(accountantId, requestId); // Verification
    return (await this.prisma.serviceRequestDocument.findMany({
      where: { userServiceId: requestId },
      include: { uploadedBy: true },
      orderBy: { createdAt: 'desc' },
    })) as any[];
  }

  async deleteDocument(accountantId: number, docId: number) {
    const doc = (await this.prisma.serviceRequestDocument.findUnique({
      where: { id: docId },
      include: { userService: { include: { user: true } }, uploadedBy: true },
    })) as any;

    if (!doc) throw new NotFoundException('Document not found');

    const isAuthorized =
      doc.userService.accountantId === accountantId ||
      doc.userService.user?.accountantId === accountantId;

    if (!isAuthorized) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (doc.uploadedBy?.role === 'user') {
      throw new BadRequestException('Accountants cannot delete client documents');
    }

    if (
      ['client', 'client_document'].includes(
        String(doc.documentType || '').toLowerCase(),
      ) &&
      ['approved', 'verified'].includes(
        String(doc.status || '').toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'Client-approved documents are read-only',
      );
    }

    await this.documentUploadService.deleteDocumentById(docId);
    return true;
  }

  async uploadDocuments(
    accountantId: number,
    requestId: number,
    files: UploadedDocumentFile[],
  ) {
    const request = await this.prisma.userService.findFirst({
      where: {
        id: requestId,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (
      ['approved', 'cancelled', 'completed', 'rejected'].includes(
        request.status,
      )
    ) {
      throw new BadRequestException(
        `Documents cannot be uploaded while the request is in '${request.status}' status.`,
      );
    }

    const processedFiles = files.map((file) => {
      const isClientVisibleCategory =
        file.documentCategory === 'certificate' ||
        file.documentCategory === 'report';

      return {
        ...file,
        documentType:
          file.documentType ||
          (isClientVisibleCategory ? 'client' : 'internal'),
        isFinal: Boolean(file.isFinal),
      };
    });

    const uploadedDocs = await this.documentUploadService.uploadDocuments(
      requestId,
      accountantId,
      processedFiles,
    );

    // Logic: if accountant upload for client certificate or report AND it is marked as FINAL then auto-approve application
    const finalAssetDoc = uploadedDocs.find(
      (doc) =>
        doc.documentType === 'client' &&
        doc.isFinal &&
        (doc.documentCategory === 'certificate' ||
          doc.documentCategory === 'report'),
    );

    if (finalAssetDoc) {
      console.log(
        '[AccountantService] Auto-approving request due to final asset upload:',
        {
          requestId,
          docId: finalAssetDoc.id,
          category: finalAssetDoc.documentCategory,
        },
      );

      const updatedRequest =
        await this.userServicesService.updateApplicationStatus(requestId, {
          status: 'approved',
          certificate_url: finalAssetDoc.filePath,
        });

      // Send notification to user
      if (updatedRequest.user) {
        await this.notificationService
          .sendServiceFinalizedNotification(updatedRequest.user, {
            id: updatedRequest.id,
            service: updatedRequest.service,
            certificateUrl: updatedRequest.certificate_url,
          })
          .catch((err) =>
            console.error(
              '[AccountantService] Failed to send finalized notification:',
              err,
            ),
          );
      }
    }

    return this.showRequest(accountantId, requestId);
  }

  async replaceClientApprovalDocument(
    accountantId: number,
    requestId: number,
    docId: number,
    file: UploadedDocumentFile | undefined,
    notes?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Corrected document is required');
    }

    const document = (await this.prisma.serviceRequestDocument.findFirst({
      where: {
        id: docId,
        userServiceId: requestId,
      },
      include: {
        uploadedBy: true,
        userService: {
          include: {
            user: true,
          },
        },
      },
    })) as any;

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const isAuthorized =
      document.userService.accountantId === accountantId ||
      document.userService.user?.accountantId === accountantId;

    if (!isAuthorized) {
      throw new UnauthorizedException('Unauthorized');
    }

    const uploaderRole = String(document.uploadedBy?.role || '').toLowerCase();
    const documentType = String(document.documentType || '').toLowerCase();

    if (uploaderRole === 'user' || uploaderRole === 'customer') {
      throw new BadRequestException(
        'Client-uploaded documents cannot be replaced by the accountant',
      );
    }

    if (!['client', 'client_document'].includes(documentType)) {
      throw new BadRequestException(
        'Only documents sent for client approval can be replaced',
      );
    }

    if (
      !['rejected', 'correction', 'correction_requested'].includes(
        String(document.status || '').toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'This document is not awaiting an accountant correction',
      );
    }

    const accountant = await this.prisma.user.findUnique({
      where: { id: accountantId },
    });
    const trimmedNote = notes?.trim();
    const responseNote = trimmedNote
      ? accountant?.name
        ? `Accountant (${accountant.name}): ${trimmedNote}`
        : `Accountant: ${trimmedNote}`
      : '';
    const existingNotes =
      typeof document.notes === 'string' ? document.notes.trim() : '';
    const combinedNotes = [existingNotes, responseNote]
      .filter(Boolean)
      .join('\n\n');

    await this.documentUploadService.replaceDocument(
      document.id,
      accountantId,
      file,
      combinedNotes || undefined,
    );

    return this.showRequest(accountantId, requestId);
  }

  async deleteDocumentFromRequest(
    accountantId: number,
    requestId: number,
    docId: number,
  ) {
    const request = await this.prisma.userService.findFirst({
      where: {
        id: requestId,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    const document = await this.prisma.serviceRequestDocument.findFirst({
      where: { id: docId, userServiceId: requestId },
      include: { uploadedBy: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploadedBy?.role === 'user') {
      throw new BadRequestException('Accountants cannot delete client documents');
    }

    if (
      ['client', 'client_document'].includes(
        String(document.documentType || '').toLowerCase(),
      ) &&
      ['approved', 'verified'].includes(
        String(document.status || '').toLowerCase(),
      )
    ) {
      throw new BadRequestException(
        'Client-approved documents are read-only',
      );
    }

    await this.documentUploadService.deleteDocumentById(docId);
    return true;
  }

  async submitRevision(accountantId: number, requestId: number, notes: string) {
    const trimmedNotes = notes.trim();

    if (!trimmedNotes) {
      throw new BadRequestException('Revision notes are required');
    }

    const request = await this.prisma.userService.findFirst({
      where: {
        id: requestId,
        OR: [
          { accountantId },
          {
            user: {
              accountantId,
            },
          },
        ],
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status !== 'update_required') {
      throw new BadRequestException(
        'Revisions can only be submitted for requests awaiting updates.',
      );
    }

    await this.userServicesService.updateApplicationStatus(requestId, {
      status: 'under_review',
    });
    await this.prisma.userService.update({
      where: { id: requestId },
      data: {
        revisionNotes: trimmedNotes,
        updateNote: null,
      },
    });

    return this.showRequest(accountantId, requestId);
  }
}
