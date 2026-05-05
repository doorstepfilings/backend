import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { ServiceEntity } from '../../catalog/infrastructure/persistence/service.entity';
import { ServiceCategoryEntity } from '../../catalog/infrastructure/persistence/service-category.entity';
import { EnquiryEntity } from '../../customer/infrastructure/persistence/enquiry.entity';
import { UserServicesService } from '../../operations/application/user-services.service';
import { UserServiceEntity } from '../../operations/infrastructure/persistence/user-service.entity';
import { UniqueIDGenerator } from '../../../shared/utils/unique-id.generator';
import { NotificationService } from '../../communication/notification.service';
import type { UpdateApplicationStatusInput } from '../../operations/application/user-services.service';
import { toUserServiceResource } from '../../operations/application/operations.mapper';
import { toEnquiryResource } from '../../customer/application/customer.mapper';

export type AdminCategoryInput = Pick<ServiceCategoryEntity, 'name' | 'icon'> &
    Partial<Omit<ServiceCategoryEntity, 'id' | 'name' | 'services' | 'slug'>>;

export type AdminServiceInput = Pick<
    ServiceEntity,
    'name' | 'serviceCategoryId'
> &
    Partial<
        Omit<
            ServiceEntity,
            | 'category'
            | 'documents'
            | 'id'
            | 'name'
            | 'serviceCategoryId'
            | 'slug'
        >
    >;

export type CreateUserInput = {
    name: string;
    email: string;
    password?: string;
    role: string;
    mobile_number?: string;
    rm_id?: number;
};

@Injectable()
export class AdminService {
    private static readonly ACTIVE_SERVICE_TERMINAL_STATUSES = [
        'cancelled',
        'completed',
        'rejected',
    ];

    private static readonly ENQUIRY_STATUSES = [
        'pending',
        'responded',
        'closed',
    ];

    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(ServiceEntity)
        private readonly servicesRepository: Repository<ServiceEntity>,
        @InjectRepository(ServiceCategoryEntity)
        private readonly categoriesRepository: Repository<ServiceCategoryEntity>,
        @InjectRepository(EnquiryEntity)
        private readonly enquiriesRepository: Repository<EnquiryEntity>,
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
        private readonly userServicesService: UserServicesService,
        private readonly notificationService: NotificationService,
    ) {}

    // ─── User Management ──────────────────────────────────────────────────────

    async getUsers(role?: string) {
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
            .loadRelationCountAndMap(
                'user.assigned_users_count',
                'user.assignedUsers',
                'u',
                (qb) => qb.where('u.role = :uRole', { uRole: 'user' }),
            )
            .getMany();

        return rms;
    }

    async getAccountants() {
        const accountants = await this.usersRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.assignedAccountantUsers', 'assignedUser')
            .where('user.role = :role', { role: 'accountant' })
            .loadRelationCountAndMap(
                'user.assigned_users_count',
                'user.assignedAccountantUsers',
                'u',
                (qb) => qb.where('u.role = :uRole', { uRole: 'user' }),
            )
            .getMany();

        return accountants;
    }

    async storeUser(data: CreateUserInput) {
        const email = data.email.trim().toLowerCase();
        const existing = await this.usersRepository.findOne({
            where: { email },
        });

        if (existing) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await hash(data.password || 'password123', 10);

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
                UniqueIDGenerator.generateUserUniqueID('regional_manager');
        } else if (data.role === 'accountant') {
            user.accountantUniqueId =
                UniqueIDGenerator.generateUserUniqueID('accountant');
        }

        const saved = await this.usersRepository.save(user);

        // Send welcome email
        this.notificationService.sendWelcomeNotification(saved);

        return saved;
    }

    async deleteUser(id: number) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id },
            relations: { assignedUsers: true, assignedAccountantUsers: true },
        });

        if (user.role === 'super_admin') {
            throw new BadRequestException('Cannot delete Super Admin');
        }

        if (user.role === 'regional_manager' && user.assignedUsers.length > 0) {
            throw new BadRequestException(
                'Cannot delete RM with assigned users. Please reassign first.',
            );
        }

        if (
            user.role === 'accountant' &&
            user.assignedAccountantUsers.length > 0
        ) {
            throw new BadRequestException(
                'Cannot delete Accountant with assigned users. Please reassign first.',
            );
        }

        await this.usersRepository.delete(id);
    }

    async assignRM(userId: number, rmId: number | null) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new BadRequestException('RM can only be assigned to users');
        }

        if (rmId) {
            await this.usersRepository.findOneOrFail({
                where: { id: rmId, role: 'regional_manager' },
            });
            const count = await this.usersRepository.count({
                where: { rmId, role: 'user' },
            });
            if (count >= 20 && user.rmId !== rmId) {
                throw new BadRequestException('RM limit reached (max 20)');
            }
            user.rmId = rmId;
        } else {
            user.rmId = null;
        }

        return this.usersRepository.save(user);
    }

    async assignAccountant(userId: number, accountantId: number | null) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new BadRequestException(
                'Accountant can only be assigned to users',
            );
        }

        if (accountantId) {
            const accountant = await this.usersRepository.findOneOrFail({
                where: { id: accountantId, role: 'accountant' },
            });
            user.accountantId = accountantId;

            // Sync active services with the new accountant
            await this.userServicesRepository.update(
                {
                    userId,
                    status: Not(
                        In(AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES),
                    ),
                },
                { accountantId },
            );

            // Notify the accountant
            this.notificationService.sendAccountantAssignmentNotification(
                accountant,
                user,
            );
        } else {
            user.accountantId = null;
            await this.userServicesRepository.update(
                {
                    userId,
                    status: Not(
                        In(AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES),
                    ),
                },
                { accountantId: null },
            );
        }

        return this.usersRepository.save(user);
    }

    async updateRole(id: number, role: string) {
        const user = await this.usersRepository.findOneOrFail({
            where: { id },
        });
        user.role = role;
        if (role !== 'user') {
            user.rmId = null;
            user.accountantId = null;
        }
        // Auto-generate unique IDs on role promotion
        if (role === 'regional_manager' && !user.rmUniqueId) {
            user.rmUniqueId = UniqueIDGenerator.generateUserUniqueID('regional_manager');
        } else if (role === 'accountant' && !user.accountantUniqueId) {
            user.accountantUniqueId = UniqueIDGenerator.generateUserUniqueID('accountant');
        }
        return this.usersRepository.save(user);
    }

    // ─── Category Management ──────────────────────────────────────────────────

    async getCategories() {
        return this.categoriesRepository
            .createQueryBuilder('category')
            .loadRelationCountAndMap('category.services_count', 'category.services')
            .orderBy('category.name', 'ASC')
            .getMany();
    }

    async storeCategory(data: AdminCategoryInput) {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const category = this.categoriesRepository.create({ ...data, slug });
        return this.categoriesRepository.save(category);
    }

    async updateCategory(id: number, data: AdminCategoryInput) {
        const category = await this.categoriesRepository.findOneOrFail({ where: { id } });
        Object.assign(category, data);
        if (data.name) {
            category.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return this.categoriesRepository.save(category);
    }

    async deleteCategory(id: number) {
        const category = await this.categoriesRepository.findOneOrFail({
            where: { id },
            relations: { services: true },
        });
        if (category.services.length > 0) {
            throw new BadRequestException('Cannot delete category with existing services');
        }
        await this.categoriesRepository.delete(id);
    }

    // ─── Service Management ───────────────────────────────────────────────────

    async getServices() {
        return this.servicesRepository.find({
            relations: { category: true },
            order: { id: 'DESC' },
        });
    }

    async getService(id: number) {
        return this.servicesRepository.findOneOrFail({
            where: { id },
            relations: { category: true },
        });
    }

    async storeService(data: AdminServiceInput) {
        const slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const service = this.servicesRepository.create({ ...data, slug });
        return this.servicesRepository.save(service);
    }

    async updateService(id: number, data: AdminServiceInput) {
        const service = await this.servicesRepository.findOneOrFail({ where: { id } });
        Object.assign(service, data);
        if (data.name) {
            service.slug = data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        return this.servicesRepository.save(service);
    }

    async deleteService(id: number) {
        await this.servicesRepository.delete(id);
    }

    // ─── Enquiry Management ───────────────────────────────────────────────────

    async getEnquiries() {
        const enquiries = await this.enquiriesRepository.find({
            order: { createdAt: 'DESC' },
        });
        return enquiries.map(toEnquiryResource);
    }

    async updateEnquiryStatus(id: number, status: string) {
        if (!AdminService.ENQUIRY_STATUSES.includes(status)) {
            throw new BadRequestException('Invalid enquiry status');
        }

        const enquiry = await this.enquiriesRepository.findOneOrFail({
            where: { id },
        });
        enquiry.status = status;
        const saved = await this.enquiriesRepository.save(enquiry);
        return toEnquiryResource(saved);
    }

    async deleteEnquiry(id: number) {
        const enquiry = await this.enquiriesRepository.findOneOrFail({
            where: { id },
        });
        await this.enquiriesRepository.remove(enquiry);
    }

    // ─── Application Management ───────────────────────────────────────────────

    async getAllServiceApplications(status?: string) {
        return this.userServicesService.getAllServices(status);
    }

    async getServiceApplication(id: number) {
        const userService = await this.userServicesRepository.findOneOrFail({
            where: { id },
            relations: {
                user: true,
                service: { category: true },
                accountant: true,
                requestDocuments: { uploadedBy: true },
            },
        });

        return toUserServiceResource(userService);
    }

    async updateApplicationStatus(
        id: number,
        data: UpdateApplicationStatusInput,
    ) {
        const result = await this.userServicesService.updateApplicationStatus(id, data);

        // Send finalized notification if marked completed/approved
        if (data.status === 'completed' || data.status === 'approved') {
            const userService = await this.userServicesRepository.findOne({
                where: { id },
                relations: { user: true, service: true },
            });
            if (userService?.user) {
                this.notificationService.sendServiceFinalizedNotification(
                    userService.user,
                    userService,
                );
            }
        }

        return result;
    }

    async assignAccountantToService(id: number, accountantId: number) {
        const accountant = await this.usersRepository.findOne({
            where: { id: accountantId, role: 'accountant' },
        });
        if (!accountant) throw new NotFoundException('Accountant not found');

        const result = await this.userServicesService.assignAccountantToService(id, accountantId);

        // Notify accountant
        const userService = await this.userServicesRepository.findOne({
            where: { id },
            relations: { user: true, service: true },
        });
        if (userService) {
            this.notificationService.sendServiceAssignmentNotification(accountant, userService);
        }

        return result;
    }

    async updateDocumentStatus(
        applicationId: number,
        docId: number,
        status: 'verified' | 'rejected',
        notes?: string,
    ) {
        return this.userServicesService.verifyDocument(
            applicationId,
            docId,
            status,
            notes,
        );
    }

    // ─── Details & Stats ──────────────────────────────────────────────────────

    async getRegionalManagerDetails(id: number) {
        const rm = await this.usersRepository.findOneOrFail({
            where: { id, role: 'regional_manager' },
            relations: { assignedUsers: { accountant: true } },
        });

        const managedUserIds = Array.isArray(rm.assignedUsers) ? rm.assignedUsers.map((u) => u.id) : [];

        const activeServicesCount = managedUserIds.length > 0
            ? await this.userServicesRepository.count({
                where: { userId: In(managedUserIds) },
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

        (rm as any).active_services_count = activeServicesCount;
        (rm as any).total_revenue = Number(totalRevenue?.total ?? 0);
        (rm as any).performance_score = this.calculateRmPerformanceScore(
            rm.assignedUsers.length,
            0,
        );

        return rm;
    }

    async getAccountantDetails(id: number) {
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

        (accountant as any).services = services;
        (accountant as any).active_services_count = services.length;
        (accountant as any).total_revenue = Number(totalRevenue?.total ?? 0);
        (accountant as any).completion_rate = this.calculateAccountantCompletionRate(services);
        (accountant as any).performance_score = this.calculateAccountantPerformanceScore(
            services.length,
            (accountant as any).completion_rate,
        );

        return accountant;
    }

    async getUserDetails(id: number) {
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

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private calculateRmPerformanceScore(userCount: number, accountantCount: number) {
        const score = userCount * 1 + accountantCount * 2;
        if (score >= 40) return 'Excellent';
        if (score >= 25) return 'Good';
        if (score >= 10) return 'Average';
        if (score >= 1) return 'Needs Improvement';
        return 'Inactive';
    }

    private calculateAccountantCompletionRate(services: UserServiceEntity[]) {
        if (services.length === 0) return 0;
        const completed = services.filter((s) => s.status === 'completed').length;
        return Math.round((completed / services.length) * 100);
    }

    private calculateAccountantPerformanceScore(userCount: number, completionRate: number) {
        const score = completionRate * 0.5 + userCount * 2;
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Average';
        if (score >= 20) return 'Needs Improvement';
        return 'Inactive';
    }

    async getStats() {
        const totalUsers = await this.usersRepository.count({ where: { role: 'user' } });
        const pendingApplications = await this.userServicesRepository.count({
            where: { status: In(['applied', 'under_review', 'update_required', 'in_progress', 'submitted_to_ca']) },
        });

        // Simple revenue calculation (sum of all paid services)
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
        // Fetch recent users
        const recentUsers = await this.usersRepository.find({
            order: { createdAt: 'DESC' },
            take: 5,
        });

        // Fetch recent service applications
        const recentServices = await this.userServicesRepository.find({
            relations: { user: true, service: true },
            order: { createdAt: 'DESC' },
            take: 5,
        });

        // Map them into a unified activity feed format
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
}
