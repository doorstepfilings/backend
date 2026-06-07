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
      where: { accountantId, role: 'user' },
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
      where: { id, accountantId, role: 'user' },
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
      accountantId,
    };
    if (status) {
      where.status = status;
    } else {
      where.status = {
        notIn: [
          ...HIDDEN_USER_SERVICE_STATUSES,
          'approved',
          'completed',
          'cancelled',
          'rejected',
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
      where: { id, accountantId },
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
      where: { id, accountantId },
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
      where: { id: userServiceId, accountantId },
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
      include: { userService: true, uploadedBy: true },
    })) as any;

    if (!doc) throw new NotFoundException('Document not found');
    if (doc.userService.accountantId != accountantId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (doc.uploadedBy?.role === 'user') {
      throw new BadRequestException('Accountants cannot delete client documents');
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
      where: { id: requestId, accountantId },
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
        isFinal: file.isFinal || isClientVisibleCategory,
      };
    });

    const uploadedDocs = await this.documentUploadService.uploadDocuments(
      requestId,
      accountantId,
      processedFiles,
    );

    // Logic: if accountant upload for client certificate or report then auto-approve application
    const finalAssetDoc = uploadedDocs.find(
      (doc) =>
        doc.documentType === 'client' &&
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

  async deleteDocumentFromRequest(
    accountantId: number,
    requestId: number,
    docId: number,
  ) {
    const request = await this.prisma.userService.findFirst({
      where: { id: requestId, accountantId },
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

    await this.documentUploadService.deleteDocumentById(docId);
    return true;
  }

  async submitRevision(accountantId: number, requestId: number, notes: string) {
    const trimmedNotes = notes.trim();

    if (!trimmedNotes) {
      throw new BadRequestException('Revision notes are required');
    }

    const request = await this.prisma.userService.findFirst({
      where: { id: requestId, accountantId },
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
