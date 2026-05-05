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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcryptjs_1 = require("bcryptjs");
const user_entity_1 = require("../../identity/infrastructure/persistence/user.entity");
const service_entity_1 = require("../../catalog/infrastructure/persistence/service.entity");
const service_category_entity_1 = require("../../catalog/infrastructure/persistence/service-category.entity");
const enquiry_entity_1 = require("../../customer/infrastructure/persistence/enquiry.entity");
const user_services_service_1 = require("../../operations/application/user-services.service");
const user_service_entity_1 = require("../../operations/infrastructure/persistence/user-service.entity");
const unique_id_generator_1 = require("../../../shared/utils/unique-id.generator");
const notification_service_1 = require("../../communication/notification.service");
const operations_mapper_1 = require("../../operations/application/operations.mapper");
const customer_mapper_1 = require("../../customer/application/customer.mapper");
let AdminService = class AdminService {
    static { AdminService_1 = this; }
    usersRepository;
    servicesRepository;
    categoriesRepository;
    enquiriesRepository;
    userServicesRepository;
    userServicesService;
    notificationService;
    static ACTIVE_SERVICE_TERMINAL_STATUSES = [
        'cancelled',
        'completed',
        'rejected',
    ];
    static ENQUIRY_STATUSES = [
        'pending',
        'responded',
        'closed',
    ];
    constructor(usersRepository, servicesRepository, categoriesRepository, enquiriesRepository, userServicesRepository, userServicesService, notificationService) {
        this.usersRepository = usersRepository;
        this.servicesRepository = servicesRepository;
        this.categoriesRepository = categoriesRepository;
        this.enquiriesRepository = enquiriesRepository;
        this.userServicesRepository = userServicesRepository;
        this.userServicesService = userServicesService;
        this.notificationService = notificationService;
    }
    async getUsers(role) {
        return this.usersRepository.find({
            where: role ? { role } : {},
            relations: { regionalManager: true, accountant: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getRMs() {
        const rms = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.assignedUsers', 'assignedUser')
            .where('user.role = :role', { role: 'regional_manager' })
            .loadRelationCountAndMap('user.assigned_users_count', 'user.assignedUsers', 'u', (qb) => qb.where('u.role = :uRole', { uRole: 'user' }))
            .getMany();
        return rms;
    }
    async getAccountants() {
        const accountants = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.assignedAccountantUsers', 'assignedUser')
            .where('user.role = :role', { role: 'accountant' })
            .loadRelationCountAndMap('user.assigned_users_count', 'user.assignedAccountantUsers', 'u', (qb) => qb.where('u.role = :uRole', { uRole: 'user' }))
            .getMany();
        return accountants;
    }
    async storeUser(data) {
        const email = data.email.trim().toLowerCase();
        const existing = await this.usersRepository.findOne({
            where: { email },
        });
        if (existing) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const hashedPassword = await (0, bcryptjs_1.hash)(data.password || 'password123', 10);
        const user = this.usersRepository.create({
            name: data.name,
            email,
            password: hashedPassword,
            role: data.role,
            mobileNumber: data.mobile_number,
            rmId: data.rm_id || null,
        });
        if (data.role === 'regional_manager') {
            user.rmUniqueId =
                unique_id_generator_1.UniqueIDGenerator.generateUserUniqueID('regional_manager');
        }
        else if (data.role === 'accountant') {
            user.accountantUniqueId =
                unique_id_generator_1.UniqueIDGenerator.generateUserUniqueID('accountant');
        }
        const saved = await this.usersRepository.save(user);
        this.notificationService.sendWelcomeNotification(saved);
        return saved;
    }
    async deleteUser(id) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id },
            relations: { assignedUsers: true, assignedAccountantUsers: true },
        });
        if (user.role === 'super_admin') {
            throw new common_1.BadRequestException('Cannot delete Super Admin');
        }
        if (user.role === 'regional_manager' && user.assignedUsers.length > 0) {
            throw new common_1.BadRequestException('Cannot delete RM with assigned users. Please reassign first.');
        }
        if (user.role === 'accountant' &&
            user.assignedAccountantUsers.length > 0) {
            throw new common_1.BadRequestException('Cannot delete Accountant with assigned users. Please reassign first.');
        }
        await this.usersRepository.delete(id);
    }
    async assignRM(userId, rmId) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new common_1.BadRequestException('RM can only be assigned to users');
        }
        if (rmId) {
            await this.usersRepository.findOneOrFail({
                where: { id: rmId, role: 'regional_manager' },
            });
            const count = await this.usersRepository.count({
                where: { rmId, role: 'user' },
            });
            if (count >= 20 && user.rmId !== rmId) {
                throw new common_1.BadRequestException('RM limit reached (max 20)');
            }
            user.rmId = rmId;
        }
        else {
            user.rmId = null;
        }
        return this.usersRepository.save(user);
    }
    async assignAccountant(userId, accountantId) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new common_1.BadRequestException('Accountant can only be assigned to users');
        }
        if (accountantId) {
            const accountant = await this.usersRepository.findOneOrFail({
                where: { id: accountantId, role: 'accountant' },
            });
            user.accountantId = accountantId;
            await this.userServicesRepository.update({
                userId,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(AdminService_1.ACTIVE_SERVICE_TERMINAL_STATUSES)),
            }, { accountantId });
            this.notificationService.sendAccountantAssignmentNotification(accountant, user);
        }
        else {
            user.accountantId = null;
            await this.userServicesRepository.update({
                userId,
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(AdminService_1.ACTIVE_SERVICE_TERMINAL_STATUSES)),
            }, { accountantId: null });
        }
        return this.usersRepository.save(user);
    }
    async updateRole(id, role) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id },
        });
        user.role = role;
        if (role !== 'user') {
            user.rmId = null;
            user.accountantId = null;
        }
        if (role === 'regional_manager' && !user.rmUniqueId) {
            user.rmUniqueId = unique_id_generator_1.UniqueIDGenerator.generateUserUniqueID('regional_manager');
        }
        else if (role === 'accountant' && !user.accountantUniqueId) {
            user.accountantUniqueId = unique_id_generator_1.UniqueIDGenerator.generateUserUniqueID('accountant');
        }
        return this.usersRepository.save(user);
    }
    async getCategories() {
        return this.categoriesRepository
            .createQueryBuilder('category')
            .loadRelationCountAndMap('category.services_count', 'category.services')
            .orderBy('category.name', 'ASC')
            .getMany();
    }
    async storeCategory(data) {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const category = this.categoriesRepository.create({ ...data, slug });
        return this.categoriesRepository.save(category);
    }
    async updateCategory(id, data) {
        const category = await this.categoriesRepository.findOneOrFail({ where: { id } });
        Object.assign(category, data);
        if (data.name) {
            category.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return this.categoriesRepository.save(category);
    }
    async deleteCategory(id) {
        const category = await this.categoriesRepository.findOneOrFail({
            where: { id },
            relations: { services: true },
        });
        if (category.services.length > 0) {
            throw new common_1.BadRequestException('Cannot delete category with existing services');
        }
        await this.categoriesRepository.delete(id);
    }
    async getServices() {
        return this.servicesRepository.find({
            relations: { category: true },
            order: { id: 'DESC' },
        });
    }
    async getService(id) {
        return this.servicesRepository.findOneOrFail({
            where: { id },
            relations: { category: true },
        });
    }
    async storeService(data) {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const service = this.servicesRepository.create({ ...data, slug });
        return this.servicesRepository.save(service);
    }
    async updateService(id, data) {
        const service = await this.servicesRepository.findOneOrFail({ where: { id } });
        Object.assign(service, data);
        if (data.name) {
            service.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return this.servicesRepository.save(service);
    }
    async deleteService(id) {
        await this.servicesRepository.delete(id);
    }
    async getEnquiries() {
        const enquiries = await this.enquiriesRepository.find({
            order: { createdAt: 'DESC' },
        });
        return enquiries.map(customer_mapper_1.toEnquiryResource);
    }
    async updateEnquiryStatus(id, status) {
        if (!AdminService_1.ENQUIRY_STATUSES.includes(status)) {
            throw new common_1.BadRequestException('Invalid enquiry status');
        }
        const enquiry = await this.enquiriesRepository.findOneOrFail({
            where: { id },
        });
        enquiry.status = status;
        const saved = await this.enquiriesRepository.save(enquiry);
        return (0, customer_mapper_1.toEnquiryResource)(saved);
    }
    async deleteEnquiry(id) {
        const enquiry = await this.enquiriesRepository.findOneOrFail({
            where: { id },
        });
        await this.enquiriesRepository.remove(enquiry);
    }
    async getAllServiceApplications(status) {
        return this.userServicesService.getAllServices(status);
    }
    async getServiceApplication(id) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
            relations: {
                user: true,
                service: { category: true },
                accountant: true,
                requestDocuments: { uploadedBy: true },
            },
        });
        return (0, operations_mapper_1.toUserServiceResource)(userService);
    }
    async updateApplicationStatus(id, data) {
        const result = await this.userServicesService.updateApplicationStatus(id, data);
        if (data.status === 'completed' || data.status === 'approved') {
            const userService = await this.userServicesRepository.findOne({
                where: { id },
                relations: { user: true, service: true },
            });
            if (userService?.user) {
                this.notificationService.sendServiceFinalizedNotification(userService.user, userService);
            }
        }
        return result;
    }
    async assignAccountantToService(id, accountantId) {
        const accountant = await this.usersRepository.findOne({
            where: { id: accountantId, role: 'accountant' },
        });
        if (!accountant)
            throw new common_1.NotFoundException('Accountant not found');
        const result = await this.userServicesService.assignAccountantToService(id, accountantId);
        const userService = await this.userServicesRepository.findOne({
            where: { id },
            relations: { user: true, service: true },
        });
        if (userService) {
            this.notificationService.sendServiceAssignmentNotification(accountant, userService);
        }
        return result;
    }
    async updateDocumentStatus(applicationId, docId, status, notes) {
        return this.userServicesService.verifyDocument(applicationId, docId, status, notes);
    }
    async getRegionalManagerDetails(id) {
        const rm = await this.usersRepository.findOneOrFail({
            where: { id, role: 'regional_manager' },
            relations: { assignedUsers: { accountant: true } },
        });
        const managedUserIds = Array.isArray(rm.assignedUsers) ? rm.assignedUsers.map((u) => u.id) : [];
        const activeServicesCount = managedUserIds.length > 0
            ? await this.userServicesRepository.count({
                where: { userId: (0, typeorm_2.In)(managedUserIds) },
            })
            : 0;
        const totalRevenue = managedUserIds.length > 0
            ? await this.userServicesRepository
                .createQueryBuilder('us')
                .select('SUM(s.price)', 'total')
                .innerJoin('us.service', 's')
                .where('us.userId IN (:...ids)', { ids: managedUserIds })
                .getRawOne()
            : { total: 0 };
        rm.active_services_count = activeServicesCount;
        rm.total_revenue = Number(totalRevenue?.total ?? 0);
        rm.performance_score = this.calculateRmPerformanceScore(rm.assignedUsers.length, 0);
        return rm;
    }
    async getAccountantDetails(id) {
        const accountant = await this.usersRepository.findOneOrFail({
            where: { id, role: 'accountant' },
            relations: { assignedAccountantUsers: { regionalManager: true } },
        });
        const services = await this.userServicesRepository.find({
            where: { accountantId: id },
            relations: { user: { regionalManager: true }, service: { category: true } },
        });
        const totalRevenue = await this.userServicesRepository
            .createQueryBuilder('us')
            .select('SUM(s.price)', 'total')
            .innerJoin('us.service', 's')
            .where('us.accountantId = :id', { id })
            .getRawOne();
        accountant.services = services;
        accountant.active_services_count = services.length;
        accountant.total_revenue = Number(totalRevenue?.total ?? 0);
        accountant.completion_rate = this.calculateAccountantCompletionRate(services);
        accountant.performance_score = this.calculateAccountantPerformanceScore(services.length, accountant.completion_rate);
        return accountant;
    }
    async getUserDetails(id) {
        return this.usersRepository.findOneOrFail({
            where: { id },
            relations: {
                regionalManager: true,
                accountant: true,
                assignedUsers: true,
                assignedAccountantUsers: true,
            },
        });
    }
    calculateRmPerformanceScore(userCount, accountantCount) {
        const score = userCount * 1 + accountantCount * 2;
        if (score >= 40)
            return 'Excellent';
        if (score >= 25)
            return 'Good';
        if (score >= 10)
            return 'Average';
        if (score >= 1)
            return 'Needs Improvement';
        return 'Inactive';
    }
    calculateAccountantCompletionRate(services) {
        if (services.length === 0)
            return 0;
        const completed = services.filter((s) => s.status === 'completed').length;
        return Math.round((completed / services.length) * 100);
    }
    calculateAccountantPerformanceScore(userCount, completionRate) {
        const score = completionRate * 0.5 + userCount * 2;
        if (score >= 80)
            return 'Excellent';
        if (score >= 60)
            return 'Good';
        if (score >= 40)
            return 'Average';
        if (score >= 20)
            return 'Needs Improvement';
        return 'Inactive';
    }
    async getStats() {
        const totalUsers = await this.usersRepository.count({ where: { role: 'user' } });
        const pendingApplications = await this.userServicesRepository.count({
            where: { status: (0, typeorm_2.In)(['applied', 'under_review', 'update_required', 'in_progress', 'submitted_to_ca']) },
        });
        const revenueResult = await this.userServicesRepository
            .createQueryBuilder('us')
            .select('SUM(CAST(us.amount AS DECIMAL(10,2)))', 'total_revenue')
            .where('us.status != :status', { status: 'in_cart' })
            .andWhere('us.payment_status = :paymentStatus', { paymentStatus: 'success' })
            .getRawOne();
        const totalRevenue = revenueResult?.total_revenue || 0;
        return {
            total_users: totalUsers,
            pending_applications: pendingApplications,
            total_revenue: totalRevenue,
        };
    }
    async getActivity() {
        const recentUsers = await this.usersRepository.find({
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const recentServices = await this.userServicesRepository.find({
            relations: { user: true, service: true },
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const activities = [
            ...(Array.isArray(recentUsers) ? recentUsers : []).map(u => ({
                id: `user-${u.id}`,
                type: 'new_user',
                message: `New user registered: ${u.name}`,
                date: u.createdAt,
            })),
            ...(Array.isArray(recentServices) ? recentServices : []).map(s => ({
                id: `service-${s.id}`,
                type: 'service_applied',
                message: `${s.user?.name || 'User'} applied for ${s.service?.name || 'a service'}`,
                date: s.createdAt,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        return activities;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.ServiceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(service_category_entity_1.ServiceCategoryEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(enquiry_entity_1.EnquiryEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_services_service_1.UserServicesService,
        notification_service_1.NotificationService])
], AdminService);
//# sourceMappingURL=admin.service.js.map