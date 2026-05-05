"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UserServicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const operations_mapper_1 = require("./operations.mapper");
const user_service_entity_1 = require("../infrastructure/persistence/user-service.entity");
const service_entity_1 = require("../../catalog/infrastructure/persistence/service.entity");
const user_entity_1 = require("../../identity/infrastructure/persistence/user.entity");
const enquiry_entity_1 = require("../../customer/infrastructure/persistence/enquiry.entity");
const payment_entity_1 = require("../infrastructure/persistence/payment.entity");
const document_upload_service_1 = require("./document-upload.service");
const slots_service_1 = require("./slots.service");
let UserServicesService = class UserServicesService {
    static { UserServicesService_1 = this; }
    userServicesRepository;
    servicesRepository;
    usersRepository;
    enquiriesRepository;
    paymentsRepository;
    slotsService;
    documentUploadService;
    constructor(userServicesRepository, servicesRepository, usersRepository, enquiriesRepository, paymentsRepository, slotsService, documentUploadService) {
        this.userServicesRepository = userServicesRepository;
        this.servicesRepository = servicesRepository;
        this.usersRepository = usersRepository;
        this.enquiriesRepository = enquiriesRepository;
        this.paymentsRepository = paymentsRepository;
        this.slotsService = slotsService;
        this.documentUploadService = documentUploadService;
    }
    async getMyServices(userId) {
        const services = await this.userServicesRepository.find({
            where: {
                status: (0, typeorm_2.Not)('in_cart'),
                userId,
            },
            relations: {
                requestDocuments: {
                    uploadedBy: true,
                },
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
        return services.map((service) => (0, operations_mapper_1.toUserServiceResource)(service, {
            includeInternalDocuments: false,
            ownerUserId: userId,
        }));
    }
    async applyForService(userId, dto, files = []) {
        const service = await this.servicesRepository.findOne({
            where: { id: dto.service_id },
            relations: { documents: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });
        const formData = dto.form_data;
        if (formData.appointment_request === 'yes') {
            const scheduledDate = formData.scheduled_date;
            const scheduledTime = formData.scheduled_time;
            if (!scheduledDate || !scheduledTime) {
                throw new common_1.BadRequestException('Appointment date and time are required');
            }
            const availability = await this.slotsService.getAvailability(dto.service_id, scheduledDate);
            const slot = availability.find((s) => s.time === scheduledTime);
            if (!slot || slot.is_full || slot.is_past) {
                throw new common_1.BadRequestException('Selected slot is full or unavailable');
            }
        }
        const existing = await this.userServicesRepository.findOne({
            where: {
                userId,
                serviceId: dto.service_id,
                status: (0, typeorm_2.In)(['applied', 'in_progress', 'completed']),
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('You have already applied for this service');
        }
        let amount = service.price;
        if (formData.pricing_plan && Array.isArray(service.pricingPlans)) {
            const plan = service.pricingPlans.find((item) => item.name === formData.pricing_plan);
            if (plan?.price !== undefined && plan.price !== null) {
                amount = String(plan.price);
            }
        }
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
        }
        else {
            userService = await this.userServicesRepository.save(this.userServicesRepository.create({
                userId,
                serviceId: dto.service_id,
                status: 'applied',
                formData,
                notes: dto.notes || null,
                amount,
            }));
        }
        if (files && files.length > 0) {
            await this.documentUploadService.uploadDocuments(userService.id, userId, files);
        }
        await this.enquiriesRepository.save(this.enquiriesRepository.create({
            name: user.name,
            email: user.email,
            phone: formData.phone || user.mobileNumber,
            service: service.name,
            message: dto.notes || 'Service application submitted',
            status: 'pending',
        }));
        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: { id: userService.id },
            relations: {
                requestDocuments: {
                    uploadedBy: true,
                },
                service: { category: true, documents: true },
                user: true,
            },
        });
        return (0, operations_mapper_1.toUserServiceResource)(hydrated, {
            includeInternalDocuments: false,
            ownerUserId: userId,
        });
    }
    async uploadMyDocuments(userId, userServiceId, files) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
            relations: {
                requestDocuments: {
                    uploadedBy: true,
                },
                service: { category: true, documents: true },
                user: true,
            },
        });
        if (!userService) {
            throw new common_1.NotFoundException('Service request not found');
        }
        const disallowedStatuses = [
            'in_cart',
            'approved',
            'rejected',
            'cancelled',
            'completed',
        ];
        if (disallowedStatuses.includes(userService.status)) {
            throw new common_1.BadRequestException(`Documents cannot be uploaded when request is in '${userService.status}' status.`);
        }
        await this.documentUploadService.uploadDocuments(userService.id, userId, files);
        const refreshed = await this.userServicesRepository.findOneOrFail({
            where: { id: userService.id },
            relations: {
                requestDocuments: {
                    uploadedBy: true,
                },
                service: { category: true, documents: true },
                user: true,
            },
        });
        return (0, operations_mapper_1.toUserServiceResource)(refreshed, {
            includeInternalDocuments: false,
            ownerUserId: userId,
        });
    }
    async deleteMyService(userId, userServiceId) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
            relations: {
                requestDocuments: true,
            },
        });
        if (!userService) {
            throw new common_1.NotFoundException('Service request not found');
        }
        if (!['applied', 'in_cart'].includes(userService.status)) {
            throw new common_1.BadRequestException('Only new applications can be removed.');
        }
        const payments = await this.paymentsRepository.find({
            where: { userServiceId: userService.id },
        });
        const hasCompletedPayment = payments.some((payment) => {
            const paymentStatus = String(payment.paymentStatus ?? payment.status ?? '').toLowerCase();
            const providerStatus = String(payment.paymentProviderStatus ?? '').toLowerCase();
            return (['paid', 'success'].includes(paymentStatus) ||
                providerStatus === 'captured' ||
                Boolean(payment.paymentProviderTransactionId));
        });
        if (hasCompletedPayment) {
            throw new common_1.BadRequestException('Paid applications cannot be removed.');
        }
        for (const document of userService.requestDocuments ?? []) {
            await this.documentUploadService.deleteDocument(document.id, document.uploadedById);
        }
        if (payments.length > 0) {
            await this.paymentsRepository.delete({
                userServiceId: userService.id,
            });
        }
        await this.userServicesRepository.delete(userService.id);
        return true;
    }
    async deleteMyDocument(userId, userServiceId, docId) {
        const userService = await this.userServicesRepository.findOne({
            where: { id: userServiceId, userId },
        });
        if (!userService) {
            throw new common_1.NotFoundException('Service request not found');
        }
        const lockedStatuses = [
            'approved',
            'completed',
            'rejected',
            'cancelled',
        ];
        if (lockedStatuses.includes(userService.status)) {
            throw new common_1.BadRequestException(`Documents cannot be deleted while the request is in '${userService.status}' status.`);
        }
        await this.documentUploadService.deleteDocument(docId, userId);
        return true;
    }
    async getAllServices(status) {
        const where = status && status !== 'all'
            ? { status }
            : { status: (0, typeorm_2.Not)('in_cart') };
        const services = await this.userServicesRepository.find({
            where,
            relations: {
                requestDocuments: {
                    uploadedBy: true,
                },
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
        return services.map((service) => (0, operations_mapper_1.toUserServiceResource)(service));
    }
    static STATUS_FLOW = {
        in_cart: ['applied'],
        applied: ['under_review', 'cancelled'],
        under_review: ['applied', 'update_required', 'in_progress', 'cancelled'],
        update_required: ['under_review', 'cancelled'],
        in_progress: ['under_review', 'submitted_to_ca', 'update_required', 'cancelled'],
        submitted_to_ca: ['in_progress', 'approved', 'cancelled'],
        approved: ['submitted_to_ca', 'completed'],
        completed: ['approved'],
        cancelled: ['applied'],
        rejected: ['applied'],
    };
    canTransitionTo(current, next) {
        if (current === next)
            return true;
        const allowed = UserServicesService_1.STATUS_FLOW[current] || [];
        return allowed.includes(next);
    }
    async updateApplicationStatus(id, data) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
        });
        if (!this.canTransitionTo(userService.status, data.status)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${userService.status} to ${data.status}`);
        }
        userService.status = data.status;
        if (data.ca_notes)
            userService.caNotes = data.ca_notes;
        if (data.update_note)
            userService.updateNote = data.update_note;
        if (data.rejection_reason)
            userService.rejectionReason = data.rejection_reason;
        if (data.certificate_url)
            userService.certificateUrl = data.certificate_url;
        if (data.status === 'approved') {
            userService.verified = true;
            if (!userService.certificateUrl && !data.certificate_url) {
                throw new common_1.BadRequestException('Certificate URL is required for approval');
            }
        }
        await this.userServicesRepository.save(userService);
        return (0, operations_mapper_1.toUserServiceResource)(userService);
    }
    async verifyDocument(userServiceId, docId, status, notes) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId },
            relations: { requestDocuments: true },
        });
        const document = userService.requestDocuments.find((d) => d.id == docId);
        if (!document) {
            throw new common_1.NotFoundException('Document not found in this request');
        }
        document.status = status;
        if (notes)
            document.notes = notes;
        await this.userServicesRepository.manager.save(document);
        if (status === 'rejected' && userService.status === 'under_review') {
            userService.status = 'update_required';
            userService.updateNote = `Document '${document.documentName}' was rejected: ${notes}`;
            await this.userServicesRepository.save(userService);
        }
        return (0, operations_mapper_1.toUserServiceResource)(userService);
    }
    async markVerified(id, verified) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
        });
        userService.verified = verified;
        await this.userServicesRepository.save(userService);
        return (0, operations_mapper_1.toUserServiceResource)(userService);
    }
    async getAccountantServices(accountantId) {
        return this.userServicesRepository.find({
            where: { accountantId, status: (0, typeorm_2.Not)('in_cart') },
            relations: {
                service: { category: true },
                user: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async getRmServices(rmId) {
        return this.userServicesRepository.find({
            where: {
                user: { rmId },
                status: (0, typeorm_2.Not)('in_cart'),
            },
            relations: {
                service: { category: true },
                user: true,
                accountant: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async assignAccountantToService(userServiceId, accountantId) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id: userServiceId },
        });
        userService.accountantId = accountantId;
        await this.userServicesRepository.save(userService);
        return (0, operations_mapper_1.toUserServiceResource)(userService);
    }
};
exports.UserServicesService = UserServicesService;
exports.UserServicesService = UserServicesService = UserServicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.ServiceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(enquiry_entity_1.EnquiryEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.PaymentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        slots_service_1.SlotsService,
        document_upload_service_1.DocumentUploadService])
], UserServicesService);
//# sourceMappingURL=user-services.service.js.map