import {
    Injectable,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { UserServiceEntity } from '../../operations/infrastructure/persistence/user-service.entity';
import { toUserResource } from '../../identity/application/identity.mapper';
import { toUserServiceResource } from '../../operations/application/operations.mapper';
import { UserServicesService, UpdateApplicationStatusInput } from '../../operations/application/user-services.service';
import { ServiceRequestDocumentEntity } from '../../operations/infrastructure/persistence/service-request-document.entity';
import {
    DocumentUploadService,
    type UploadedDocumentFile,
} from '../../operations/application/document-upload.service';

@Injectable()
export class AccountantService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
        @InjectRepository(ServiceRequestDocumentEntity)
        private readonly documentsRepository: Repository<ServiceRequestDocumentEntity>,
        private readonly userServicesService: UserServicesService,
        private readonly documentUploadService: DocumentUploadService,
    ) {}

    async getAssignedUsers(accountantId: number) {
        const users = await this.usersRepository.find({
            where: { accountantId, role: 'user' },
            relations: { 
                regionalManager: true,
                accountant: true
            },
            order: { name: 'ASC' },
        });

        if (users.length === 0) return [];

        // Fetch services for all these users in one query
        const userIds = users.map(u => u.id);
        const allServices = await this.userServicesRepository.find({
            where: { userId: In(userIds) as any },
            relations: { service: true }
        });

        // Group services by userId
        const servicesMap = new Map<number, any[]>();
        allServices.forEach(s => {
            if (!servicesMap.has(Number(s.userId))) {
                servicesMap.set(Number(s.userId), []);
            }
            servicesMap.get(Number(s.userId))?.push(s);
        });

        return users.map(user => {
            (user as any).services = servicesMap.get(user.id) || [];
            return toUserResource(user);
        });
    }

    async getUserById(accountantId: number, id: number) {
        const user = await this.usersRepository.findOne({
            where: { id, accountantId, role: 'user' },
            relations: { 
                regionalManager: true,
                accountant: true,
            },
        });
        
        if (!user) throw new NotFoundException('Client not found');

        // Fetch all services for this user
        const services = await this.userServicesRepository.find({
            where: { userId: id },
            relations: { service: true },
            order: { updatedAt: 'DESC' }
        });

        (user as any).services = services;
        return toUserResource(user);
    }

    async listRequests(accountantId: number, status?: string) {
        const where: any = { accountantId, status: Not('in_cart') };
        if (status) where.status = status;

        const requests = await this.userServicesRepository.find({
            where,
            relations: {
                user: true,
                service: { category: true },
                requestDocuments: { uploadedBy: true },
            },
            order: { updatedAt: 'DESC' },
        });

        return requests.map((request) => toUserServiceResource(request));
    }

    async showRequest(accountantId: number, id: number) {
        const request = await this.userServicesRepository.findOne({
            where: { id, accountantId },
            relations: {
                user: true,
                service: { category: true },
                requestDocuments: { uploadedBy: true },
            },
        });

        if (!request) throw new NotFoundException('Service request not found');
        return toUserServiceResource(request);
    }

    async updateStatus(
        accountantId: number,
        id: number,
        data: UpdateApplicationStatusInput,
    ) {
        await this.userServicesRepository.findOneOrFail({
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
        await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId, accountantId },
        });

        return this.userServicesService.verifyDocument(userServiceId, docId, status, notes);
    }

    async listDocuments(accountantId: number, requestId: number) {
        await this.showRequest(accountantId, requestId); // Verification
        return this.documentsRepository.find({
            where: { userServiceId: requestId },
            relations: { uploadedBy: true },
            order: { createdAt: 'DESC' },
        });
    }

    async deleteDocument(accountantId: number, docId: number) {
        const doc = await this.documentsRepository.findOne({
            where: { id: docId },
            relations: { userService: true },
        });

        if (!doc) throw new NotFoundException('Document not found');
        if (doc.userService.accountantId != accountantId) {
            throw new UnauthorizedException('Unauthorized');
        }

        await this.documentUploadService.deleteDocumentById(docId);
        return true;
    }

    async uploadDocuments(
        accountantId: number,
        requestId: number,
        files: UploadedDocumentFile[],
    ) {
        const request = await this.userServicesRepository.findOne({
            where: { id: requestId, accountantId },
        });

        if (!request) {
            throw new NotFoundException('Service request not found');
        }

        if (['approved', 'cancelled', 'completed', 'rejected'].includes(request.status)) {
            throw new BadRequestException(
                `Documents cannot be uploaded while the request is in '${request.status}' status.`,
            );
        }

        const processedFiles = files.map((file) => ({
            ...file,
            documentType: file.documentType || 'internal',
        }));

        await this.documentUploadService.uploadDocuments(
            requestId,
            accountantId,
            processedFiles,
        );

        return this.showRequest(accountantId, requestId);
    }

    async deleteDocumentFromRequest(
        accountantId: number,
        requestId: number,
        docId: number,
    ) {
        const request = await this.userServicesRepository.findOne({
            where: { id: requestId, accountantId },
        });

        if (!request) {
            throw new NotFoundException('Service request not found');
        }

        const document = await this.documentsRepository.findOne({
            where: { id: docId, userServiceId: requestId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        await this.documentUploadService.deleteDocumentById(docId);
        return true;
    }

    async submitRevision(accountantId: number, requestId: number, notes: string) {
        const trimmedNotes = notes.trim();

        if (!trimmedNotes) {
            throw new BadRequestException('Revision notes are required');
        }

        const request = await this.userServicesRepository.findOne({
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
        await this.userServicesRepository.update(
            { id: requestId, accountantId },
            {
                revisionNotes: trimmedNotes,
                updateNote: null,
            },
        );

        return this.showRequest(accountantId, requestId);
    }
}
