import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Not, QueryFailedError, Repository } from 'typeorm';
import { toUserServiceResource } from './operations.mapper';
import { ServiceRequestDocumentEntity } from '../infrastructure/persistence/service-request-document.entity';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
import { ServiceEntity } from '../../catalog/infrastructure/persistence/service.entity';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { EnquiryEntity } from '../../customer/infrastructure/persistence/enquiry.entity';
import { PaymentEntity } from '../infrastructure/persistence/payment.entity';
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
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
        @InjectRepository(ServiceRequestDocumentEntity)
        private readonly requestDocumentsRepository: Repository<ServiceRequestDocumentEntity>,
        @InjectRepository(ServiceEntity)
        private readonly servicesRepository: Repository<ServiceEntity>,
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(EnquiryEntity)
        private readonly enquiriesRepository: Repository<EnquiryEntity>,
        @InjectRepository(PaymentEntity)
        private readonly paymentsRepository: Repository<PaymentEntity>,
        private readonly slotsService: SlotsService,
        private readonly documentUploadService: DocumentUploadService,
    ) {}

    async getMyServices(userId: number) {
        const services = await this.userServicesRepository.find({
            where: {
                status: Not('in_cart'),
                userId,
            },
            relations: {
                accountant: true,
                service: {
                    category: true,
                    documents: true,
                },
                user: {
                    accountant: true,
                    regionalManager: true,
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });

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
        const service = await this.servicesRepository.findOne({
            where: { id: dto.service_id },
            relations: { documents: true },
        });

        if (!service) {
            throw new NotFoundException('Service not found');
        }

        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });

        const formData: ApplyServiceFormData = dto.form_data;

        // Slot verification
        if (formData.appointment_request === 'yes') {
            const scheduledDate = formData.scheduled_date;
            const scheduledTime = formData.scheduled_time;

            if (!scheduledDate || !scheduledTime) {
                throw new BadRequestException(
                    'Appointment date and time are required',
                );
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

        // Check if already applied
        const existing = await this.userServicesRepository.findOne({
            where: {
                userId,
                serviceId: dto.service_id,
                status: In(['applied', 'in_progress', 'completed']),
            },
        });

        if (existing) {
            throw new BadRequestException(
                'You have already applied for this service',
            );
        }

        // Resolve amount (if not already set in cart)
        let amount = service.price;
        if (formData.pricing_plan && Array.isArray(service.pricingPlans)) {
            const plan = (service.pricingPlans as PricingPlan[]).find(
                (item) => item.name === formData.pricing_plan,
            );
            if (plan?.price !== undefined && plan.price !== null) {
                amount = String(plan.price);
            }
        }

        // Update or create
        let userService = await this.userServicesRepository.findOne({
            where: {
                userId,
                serviceId: dto.service_id,
                status: 'in_cart',
            },
        });

        if (userService) {
            userService.status = 'applied';
            userService.formData = formData;
            userService.notes = dto.notes || null;
            userService.amount = amount;
            await this.userServicesRepository.save(userService);
        } else {
            userService = await this.userServicesRepository.save(
                this.userServicesRepository.create({
                    userId,
                    serviceId: dto.service_id,
                    status: 'applied',
                    formData,
                    notes: dto.notes || null,
                    amount,
                }),
            );
        }

        if (files && files.length > 0) {
            await this.documentUploadService.uploadDocuments(
                userService.id,
                userId,
                files,
            );
        }

        // Log enquiry
        await this.enquiriesRepository.save(
            this.enquiriesRepository.create({
                name: user.name,
                email: user.email,
                phone: formData.phone || user.mobileNumber,
                service: service.name,
                message: dto.notes || 'Service application submitted',
                status: 'pending',
            }),
        );

        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: { id: userService.id },
            relations: {
                service: { category: true, documents: true },
                user: true,
            },
        });

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
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
            relations: {
                service: { category: true, documents: true },
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

        const refreshed = await this.userServicesRepository.findOneOrFail({
            where: { id: userService.id },
            relations: {
                service: { category: true, documents: true },
                user: true,
            },
        });

        await this.populateRequestDocuments(refreshed);
        await this.populateLatestPayments(refreshed);

        return toUserServiceResource(refreshed, {
            includeInternalDocuments: false,
            ownerUserId: userId,
        });
    }

    async deleteMyService(userId: number, userServiceId: number) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
            relations: {
                requestDocuments: true,
            },
        });

        if (!userService) {
            throw new NotFoundException('Service request not found');
        }

        if (!['applied', 'in_cart'].includes(userService.status)) {
            throw new BadRequestException(
                'Only new applications can be removed.',
            );
        }

        const payments = await this.paymentsRepository.find({
            where: { userServiceId: userService.id },
        });

        const hasCompletedPayment = payments.some((payment) => {
            const paymentStatus = String(
                payment.paymentStatus ?? payment.status ?? '',
            ).toLowerCase();
            const providerStatus = String(
                payment.paymentProviderStatus ?? '',
            ).toLowerCase();

            return (
                ['paid', 'success'].includes(paymentStatus) ||
                providerStatus === 'captured' ||
                Boolean(payment.paymentProviderTransactionId)
            );
        });

        if (hasCompletedPayment) {
            throw new BadRequestException(
                'Paid applications cannot be removed.',
            );
        }

        for (const document of userService.requestDocuments ?? []) {
            await this.documentUploadService.deleteDocument(
                document.id,
                document.uploadedById,
            );
        }

        if (payments.length > 0) {
            await this.paymentsRepository.delete({
                userServiceId: userService.id,
            });
        }

        await this.userServicesRepository.delete(userService.id);

        return true;
    }

    async deleteMyDocument(
        userId: number,
        userServiceId: number,
        docId: number,
    ) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
        });

        if (!userService) {
            throw new NotFoundException('Service request not found');
        }

        const lockedStatuses = [
            'approved',
            'completed',
            'rejected',
            'cancelled',
        ];

        if (lockedStatuses.includes(userService.status)) {
            throw new BadRequestException(
                `Documents cannot be deleted while the request is in '${userService.status}' status.`,
            );
        }

        await this.documentUploadService.deleteDocument(docId, userId);

        return true;
    }

    async getAllServices(status?: string) {
        const where: FindOptionsWhere<UserServiceEntity> =
            status && status !== 'all'
                ? { status }
                : { status: Not('in_cart') };

        const services = await this.userServicesRepository.find({
            where,
            relations: {
                accountant: true,
                service: {
                    category: true,
                    documents: true,
                },
                user: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        await this.populateRequestDocuments(services);
        await this.populateLatestPayments(services);
        this.sortByLatestOrderFirst(services);

        return services.map((service) => toUserServiceResource(service));
    }

    // Status State Machine
    private static readonly STATUS_FLOW: Record<string, string[]> = {
        in_cart: ['applied'],
        applied: ['under_review', 'approved', 'cancelled'],
        paid: ['under_review', 'approved', 'cancelled'],
        under_review: ['applied', 'update_required', 'in_progress', 'approved', 'cancelled'],
        update_required: ['under_review', 'approved', 'cancelled'],
        in_progress: ['under_review', 'submitted_to_ca', 'update_required', 'approved', 'cancelled'],
        submitted_to_ca: ['in_progress', 'approved', 'cancelled'],
        approved: ['submitted_to_ca', 'completed'],
        completed: ['approved'],
        cancelled: ['applied'],
        rejected: ['applied'],
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
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
        });

        if (!this.canTransitionTo(userService.status, data.status)) {
            throw new BadRequestException(
                `Invalid status transition from ${userService.status} to ${data.status}`,
            );
        }

        userService.status = data.status;
        if (data.ca_notes) userService.caNotes = data.ca_notes;
        if (data.update_note) userService.updateNote = data.update_note;
        if (data.rejection_reason)
            userService.rejectionReason = data.rejection_reason;
        if (data.certificate_url)
            userService.certificateUrl = data.certificate_url;

        if (data.status === 'approved') {
            userService.verified = true;
            if (!userService.certificateUrl && !data.certificate_url) {
                throw new BadRequestException('Certificate URL is required for approval');
            }
        }

        await this.userServicesRepository.save(userService);
        
        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: { id },
            relations: {
                service: { category: true, documents: true },
                user: true,
                accountant: true,
            },
        });

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
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId },
            relations: {
                service: { category: true },
                user: true,
                accountant: true,
            },
        });

        const document = await this.requestDocumentsRepository.findOne({
            where: { id: docId, userServiceId },
            relations: { uploadedBy: true },
        });
        if (!document) {
            throw new NotFoundException('Document not found in this request');
        }

        document.status = status;
        if (notes) document.notes = notes;

        await this.userServicesRepository.manager.save(document);

        // If any document is rejected, potentially move the whole application to 'update_required'
        if (status === 'rejected' && userService.status === 'under_review') {
            userService.status = 'update_required';
            userService.updateNote = `Document '${document.documentName}' was rejected: ${notes}`;
            await this.userServicesRepository.save(userService);
        }

        userService.requestDocuments = [document];
        await this.populateRequestDocuments(userService);
        await this.populateLatestPayments(userService);

        return toUserServiceResource(userService);
    }

    async markVerified(id: number, verified: boolean) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
        });
        userService.verified = verified;
        await this.userServicesRepository.save(userService);

        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: { id },
            relations: {
                service: { category: true },
                user: true,
                accountant: true,
            },
        });

        await this.populateRequestDocuments(hydrated);
        await this.populateLatestPayments(hydrated);

        return toUserServiceResource(hydrated);
    }

    async getAccountantServices(accountantId: number) {
        return this.userServicesRepository.find({
            where: { accountantId, status: Not('in_cart') },
            relations: {
                service: { category: true },
                user: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async getRmServices(rmId: number) {
        // Logic to get services for users connected to this RM
        return this.userServicesRepository.find({
            where: {
                user: { rmId },
                status: Not('in_cart'),
            },
            relations: {
                service: { category: true },
                user: true,
                accountant: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    async assignAccountantToService(
        userServiceId: number,
        accountantId: number,
    ) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId },
        });
        userService.accountantId = accountantId;
        await this.userServicesRepository.save(userService);

        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId },
            relations: {
                service: { category: true },
                user: true,
                accountant: true,
            },
        });

        await this.populateRequestDocuments(hydrated);
        await this.populateLatestPayments(hydrated);

        return toUserServiceResource(hydrated);
    }

    async populateLatestPayments<
        T extends UserServiceEntity | UserServiceEntity[],
    >(input: T): Promise<T> {
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

        const payments = await this.paymentsRepository
            .createQueryBuilder('payment')
            .where('(payment.userServiceId IN (:...serviceIds) OR payment.userId IN (:...userIds))', { serviceIds, userIds })
            .andWhere('payment.status != :status', { status: 'abandoned' })
            .orderBy('payment.createdAt', 'DESC')
            .addOrderBy('payment.id', 'DESC')
            .getMany();

        const targetServiceIds = new Set(serviceIds);
        const latestPaymentsByServiceId = new Map<number, PaymentEntity>();

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

    async populateRequestDocuments<
        T extends UserServiceEntity | UserServiceEntity[],
    >(input: T): Promise<T> {
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
            const documents = await this.requestDocumentsRepository.find({
                where: { userServiceId: In(serviceIds) },
                relations: { uploadedBy: true },
                order: { createdAt: 'ASC' },
            });

            const documentsByServiceId = new Map<
                number,
                ServiceRequestDocumentEntity[]
            >();

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

    private resolvePaymentLinkedServiceIds(payment: PaymentEntity) {
        const cartItemIds = Array.isArray((payment.notes as any)?.cart_item_ids)
            ? (payment.notes as any).cart_item_ids
            : [];
        const serviceIds = [...cartItemIds, payment.userServiceId].filter(
            (value): value is number => Number.isInteger(Number(value)),
        );

        return [...new Set(serviceIds.map((value) => Number(value)))];
    }

    private sortByLatestOrderFirst(services: UserServiceEntity[]) {
        services.sort((left, right) => {
            const rightDate = this.resolveServiceSortTimestamp(right);
            const leftDate = this.resolveServiceSortTimestamp(left);

            if (rightDate !== leftDate) {
                return rightDate - leftDate;
            }

            return Number(right.id) - Number(left.id);
        });
    }

    private resolveServiceSortTimestamp(service: UserServiceEntity) {
        const primaryDate = service.latestPayment?.createdAt ?? service.createdAt;
        const timestamp = new Date(primaryDate).getTime();

        return Number.isFinite(timestamp) ? timestamp : 0;
    }

    private isRecoverableRequestDocumentsQueryError(error: unknown) {
        if (!(error instanceof QueryFailedError)) {
            return false;
        }

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
