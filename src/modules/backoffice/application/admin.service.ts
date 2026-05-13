import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { hash } from 'bcryptjs';
import { UserServicesService } from '../../operations/application/user-services.service';
import { REVIEW_QUEUE_APPLICATION_STATUSES } from '../../operations/application/user-service-status';
import { UniqueIDGenerator } from '../../../shared/utils/unique-id.generator';
import { NotificationService } from '../../communication/notification.service';
import type { UpdateApplicationStatusInput } from '../../operations/application/user-services.service';
import { toUserServiceResource } from '../../operations/application/operations.mapper';
import { toEnquiryResource } from '../../customer/application/customer.mapper';
import {
    normalizeAdminCategoryInput,
    normalizeAdminServiceInput,
    toAdminCategoryResource,
    toAdminServiceResource,
} from './admin.mapper';

export type AdminCategoryInput = any;

export type AdminServiceInput = any;

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
        private readonly prisma: PrismaService,
        private readonly userServicesService: UserServicesService,
        private readonly notificationService: NotificationService,
    ) {}

    private normalizeInteger(value: number | string, fieldName: string) {
        const parsed =
            typeof value === 'number' ? value : Number(String(value).trim());

        if (!Number.isInteger(parsed)) {
            throw new BadRequestException(`${fieldName} must be a valid integer`);
        }

        return parsed;
    }

    // ─── User Management ──────────────────────────────────────────────────────

    async getUsers(role?: string) {
        return (await this.prisma.user.findMany({
            where: role ? { role } : {},
            include: { regionalManager: true, accountant: true },
            orderBy: { createdAt: 'desc' },
        })) as any[];
    }

    async getRMs() {
        const rms = await this.prisma.user.findMany({
            where: { role: 'regional_manager' },
            include: {
                _count: {
                    select: { assignedUsers: true }
                }
            }
        });

        return rms.map(rm => ({
            ...rm,
            assigned_users_count: rm._count.assignedUsers
        }));
    }

    async getAccountants() {
        const accountants = await this.prisma.user.findMany({
            where: { role: 'accountant' },
            include: {
                _count: {
                    select: { assignedAccountants: true }
                }
            }
        });

        return accountants.map(acc => ({
            ...acc,
            assigned_users_count: acc._count.assignedAccountants
        }));
    }

    async storeUser(data: CreateUserInput) {
        const email = data.email.trim().toLowerCase();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await hash(data.password || 'password123', 10);

        const userData: any = {
            name: data.name,
            email,
            password: hashedPassword,
            role: data.role,
            mobileNumber: data.mobile_number,
            rmId: data.rm_id || null,
        };

        if (data.role === 'regional_manager') {
            userData.rmUniqueId =
                UniqueIDGenerator.generateUserUniqueID('regional_manager');
        } else if (data.role === 'accountant') {
            userData.accountantUniqueId =
                UniqueIDGenerator.generateUserUniqueID('accountant');
        }

        const saved = await this.prisma.user.create({ data: userData });

        // Send welcome email
        await this.notificationService.sendWelcomeNotification(saved as any);


        return saved;
    }

    async deleteUser(id: number) {
        const user = (await this.prisma.user.findUniqueOrThrow({
            where: { id },
            include: { assignedUsers: true, assignedAccountants: true },
        })) as any;

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
            user.assignedAccountants.length > 0
        ) {
            throw new BadRequestException(
                'Cannot delete Accountant with assigned users. Please reassign first.',
            );
        }

        await this.prisma.user.delete({ where: { id } });
    }

    async assignRM(userId: number, rmId: number | null) {
        userId = this.normalizeInteger(userId, 'user_id');
        rmId =
            rmId === null || rmId === undefined || rmId === ('' as any)
                ? null
                : this.normalizeInteger(rmId, 'rm_id');

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new BadRequestException('RM can only be assigned to users');
        }

        if (rmId) {
            await this.prisma.user.findFirstOrThrow({
                where: { id: rmId, role: 'regional_manager' },
            });
            const count = await this.prisma.user.count({
                where: { rmId, role: 'user' },
            });
            if (count >= 20 && user.rmId !== rmId) {
                throw new BadRequestException('RM limit reached (max 20)');
            }
            return this.prisma.user.update({
                where: { id: userId },
                data: { rmId }
            });
        } else {
            return this.prisma.user.update({
                where: { id: userId },
                data: { rmId: null }
            });
        }
    }

    async assignAccountant(userId: number, accountantId: number | null) {
        userId = this.normalizeInteger(userId, 'user_id');
        accountantId =
            accountantId === null ||
            accountantId === undefined ||
            accountantId === ('' as any)
                ? null
                : this.normalizeInteger(accountantId, 'accountant_id');

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        if (user.role !== 'user') {
            throw new BadRequestException(
                'Accountant can only be assigned to users',
            );
        }

        if (accountantId) {
            const accountant = (await this.prisma.user.findFirstOrThrow({
                where: { id: accountantId, role: 'accountant' },
            })) as any;

            // Sync active services with the new accountant
            await this.prisma.userService.updateMany({
                where: {
                    userId,
                    status: { notIn: AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES },
                },
                data: { accountantId },
            });

            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: { accountantId }
            });

            // Notify the accountant
            await this.notificationService.sendAccountantAssignmentNotification(
                accountant,
                user as any,
            ).catch(err => console.error('[AdminService] Failed to notify accountant:', err));

            return updatedUser;
        } else {
            await this.prisma.userService.updateMany({
                where: {
                    userId,
                    status: { notIn: AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES },
                },
                data: { accountantId: null },
            });

            return this.prisma.user.update({
                where: { id: userId },
                data: { accountantId: null }
            });
        }
    }

    async updateRole(id: number, role: string) {
        const user = (await this.prisma.user.findUniqueOrThrow({
            where: { id },
        })) as any;
        
        const updateData: any = { role };
        if (role !== 'user') {
            updateData.rmId = null;
            updateData.accountantId = null;
        }
        
        // Auto-generate unique IDs on role promotion
        if (role === 'regional_manager' && !user.rmUniqueId) {
            updateData.rmUniqueId = UniqueIDGenerator.generateUserUniqueID('regional_manager');
        } else if (role === 'accountant' && !user.accountantUniqueId) {
            updateData.accountantUniqueId = UniqueIDGenerator.generateUserUniqueID('accountant');
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }

    // ─── Category Management ──────────────────────────────────────────────────

    async getCategories() {
        const categories = await this.prisma.serviceCategory.findMany({
            include: {
                _count: {
                    select: { services: true }
                }
            },
            orderBy: { name: 'asc' },
        });

        return categories.map(cat => toAdminCategoryResource({
            ...cat,
            services_count: cat._count.services
        }));
    }

    async storeCategory(data: AdminCategoryInput) {
        const normalized = normalizeAdminCategoryInput(data);

        if (!normalized.name) {
            throw new BadRequestException('Category name is required');
        }

        const slug = this.slugify(normalized.name);
        
        try {
            const saved = await this.prisma.serviceCategory.create({
                data: {
                    ...normalized,
                    slug,
                }
            });
            return toAdminCategoryResource(saved);
        } catch (error) {
            this.rethrowFriendlyConstraintError(error, 'Category');
            throw error;
        }
    }

    async updateCategory(id: number, data: AdminCategoryInput) {
        const normalized = normalizeAdminCategoryInput(data);
        const updateData: any = { ...normalized };
        
        if (normalized.name) {
            updateData.slug = this.slugify(normalized.name);
        }

        try {
            const saved = await this.prisma.serviceCategory.update({
                where: { id },
                data: updateData
            });
            return toAdminCategoryResource(saved);
        } catch (error) {
            this.rethrowFriendlyConstraintError(error, 'Category');
            throw error;
        }
    }

    async deleteCategory(id: number) {
        const category = await this.prisma.serviceCategory.findUniqueOrThrow({
            where: { id },
            include: { services: true },
        });
        if (category.services.length > 0) {
            throw new BadRequestException('Cannot delete category with existing services');
        }
        await this.prisma.serviceCategory.delete({ where: { id } });
    }

    // ─── Service Management ───────────────────────────────────────────────────

    async getServices() {
        const services = await this.prisma.service.findMany({
            include: { category: true },
            orderBy: { id: 'desc' },
        });

        return services.map(toAdminServiceResource);
    }

    async getService(id: number) {
        const service = await this.prisma.service.findUniqueOrThrow({
            where: { id },
            include: { category: true, documents: true },
        });

        return toAdminServiceResource(service);
    }

    async storeService(data: AdminServiceInput) {
        const normalized = normalizeAdminServiceInput(data);

        if (!normalized.name) {
            throw new BadRequestException('Service name is required');
        }

        if (!normalized.serviceCategoryId) {
            throw new BadRequestException('service_category_id is required');
        }

        await this.ensureCategoryExists(normalized.serviceCategoryId);

        try {
            const saved = await this.prisma.service.create({
                data: {
                    ...normalized,
                    slug: this.slugify(normalized.name),
                }
            });
            return this.getService(saved.id);
        } catch (error) {
            this.rethrowFriendlyConstraintError(error, 'Service');
            throw error;
        }
    }

    async updateService(id: number, data: AdminServiceInput) {
        const normalized = normalizeAdminServiceInput(data);

        if (normalized.serviceCategoryId !== undefined) {
            await this.ensureCategoryExists(normalized.serviceCategoryId);
        }

        const updateData: any = { ...normalized };
        if (normalized.name) {
            updateData.slug = this.slugify(normalized.name);
        }

        try {
            await this.prisma.service.update({
                where: { id },
                data: updateData
            });
            return this.getService(id);
        } catch (error) {
            this.rethrowFriendlyConstraintError(error, 'Service');
            throw error;
        }
    }

    async deleteService(id: number) {
        await this.prisma.service.findUniqueOrThrow({ where: { id } });

        try {
            await this.prisma.service.delete({ where: { id } });
        } catch (error) {
            if (this.isConstraintError(error)) {
                throw new BadRequestException(
                    'Cannot delete service with existing applications or linked documents',
                );
            }

            throw error;
        }
    }

    // ─── Enquiry Management ───────────────────────────────────────────────────

    async getEnquiries() {
        const enquiries = await this.prisma.enquiry.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return enquiries.map(toEnquiryResource);
    }

    async updateEnquiryStatus(id: number, status: string) {
        if (!AdminService.ENQUIRY_STATUSES.includes(status)) {
            throw new BadRequestException('Invalid enquiry status');
        }

        const saved = await this.prisma.enquiry.update({
            where: { id },
            data: { status }
        });
        return toEnquiryResource(saved);
    }

    async deleteEnquiry(id: number) {
        await this.prisma.enquiry.delete({ where: { id } });
    }

    // ─── Application Management ───────────────────────────────────────────────

    async getAllServiceApplications(status?: string) {
        return this.userServicesService.getAllServices(status);
    }

    async getServiceApplication(id: number) {
        const userService = (await this.prisma.userService.findUniqueOrThrow({
            where: { id },
            include: {
                user: true,
                service: { include: { category: true } },
                accountant: true,
            },
        })) as any;

        await this.userServicesService.populateRequestDocuments(userService);
        await this.userServicesService.populateLatestPayments(userService);

        return toUserServiceResource(userService);
    }

    async updateApplicationStatus(
        id: number,
        data: UpdateApplicationStatusInput,
    ) {
        id = this.normalizeInteger(id, 'application_id');
        const result = await this.userServicesService.updateApplicationStatus(id, data);

        // Send finalized notification if marked completed/approved
        if (data.status === 'completed' || data.status === 'approved') {
            const userService = (await this.prisma.userService.findUnique({
                where: { id },
                include: { user: true, service: true },
            })) as any;
            if (userService?.user) {
                await this.notificationService.sendServiceFinalizedNotification(
                    userService.user,
                    userService,
                ).catch(err => console.error('[AdminService] Notification error:', err));
            }
        }

        return result;
    }

    async assignAccountantToService(id: number, accountantId: number) {
        id = this.normalizeInteger(id, 'application_id');
        accountantId = this.normalizeInteger(accountantId, 'accountant_id');

        const accountant = (await this.prisma.user.findFirst({
            where: { id: accountantId, role: 'accountant' },
        })) as any;
        if (!accountant) throw new NotFoundException('Accountant not found');

        const result = await this.userServicesService.assignAccountantToService(id, accountantId);

        // Notify accountant
        const userService = (await this.prisma.userService.findUnique({
            where: { id },
            include: { user: true, service: true },
        })) as any;
        if (userService) {
            await this.notificationService.sendServiceAssignmentNotification(accountant, userService)
                .catch(err => console.error('[AdminService] Notification error:', err));
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
        const rm = (await this.prisma.user.findFirstOrThrow({
            where: { id, role: 'regional_manager' },
            include: { assignedUsers: { include: { accountant: true } } },
        })) as any;

        const managedUserIds = Array.isArray(rm.assignedUsers) ? rm.assignedUsers.map((u: any) => u.id) : [];

        const activeServicesCount = managedUserIds.length > 0
            ? await this.prisma.userService.count({
                where: { userId: { in: managedUserIds } },
            })
            : 0;

        const totalRevenueResult = managedUserIds.length > 0
            ? await this.prisma.userService.aggregate({
                where: { userId: { in: managedUserIds } },
                _sum: { amount: true }
            })
            : { _sum: { amount: 0 } };

        rm.active_services_count = activeServicesCount;
        rm.total_revenue = Number(totalRevenueResult._sum.amount ?? 0);
        rm.performance_score = this.calculateRmPerformanceScore(
            rm.assignedUsers.length,
            0,
        );

        return rm;
    }

    async getAccountantDetails(id: number) {
        const accountant = (await this.prisma.user.findFirstOrThrow({
            where: { id, role: 'accountant' },
            include: { assignedAccountants: { include: { regionalManager: true } } },
        })) as any;

        const services = await this.prisma.userService.findMany({
            where: { accountantId: id },
            include: { user: { include: { regionalManager: true } }, service: { include: { category: true } } },
        });

        const totalRevenueResult = await this.prisma.userService.aggregate({
            where: { accountantId: id },
            _sum: { amount: true }
        });

        accountant.services = services;
        accountant.active_services_count = services.length;
        accountant.total_revenue = Number(totalRevenueResult._sum.amount ?? 0);
        accountant.completion_rate = this.calculateAccountantCompletionRate(services);
        accountant.performance_score = this.calculateAccountantPerformanceScore(
            services.length,
            accountant.completion_rate,
        );

        return accountant;
    }

    async getUserDetails(id: number) {
        return this.prisma.user.findUniqueOrThrow({
            where: { id },
            include: {
                regionalManager: true,
                accountant: true,
                assignedUsers: true,
                assignedAccountants: true,
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

    private calculateAccountantCompletionRate(services: any[]) {
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
        const totalUsers = await this.prisma.user.count({ where: { role: 'user' } });
        const pendingApplications = await this.prisma.userService.count({
            where: {
                status: {
                    in: [...REVIEW_QUEUE_APPLICATION_STATUSES],
                },
            },
        });

        // Simple revenue calculation (sum of all paid services)
        const revenueResult = await this.prisma.userService.aggregate({
            where: {
                status: { not: 'in_cart' },
                paymentStatus: { in: ['success', 'paid'] },
            },
            _sum: { amount: true }
        });

        const totalRevenue = Number(revenueResult._sum.amount || 0);

        return {
            total_users: totalUsers,
            pending_applications: pendingApplications,
            total_revenue: totalRevenue,
        };
    }

    async getActivity() {
        // Fetch recent users
        const recentUsers = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        // Fetch recent service applications
        const recentServices = await this.prisma.userService.findMany({
            include: { user: true, service: true },
            orderBy: { createdAt: 'desc' },
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

    private slugify(value: string) {
        return value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    private async ensureCategoryExists(serviceCategoryId: number) {
        const category = await this.prisma.serviceCategory.findUnique({
            where: { id: serviceCategoryId },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }
    }

    private rethrowFriendlyConstraintError(error: unknown, resourceName: string) {
        if (!this.isConstraintError(error)) {
            return;
        }

        throw new BadRequestException(
            `${resourceName} could not be saved because one of its values conflicts with existing data`,
        );
    }

    private isConstraintError(error: any) {
        const message = String(error.message || '').toLowerCase();

        return (
            message.includes('duplicate') ||
            message.includes('unique') ||
            message.includes('constraint') ||
            message.includes('foreign key') ||
            message.includes('p2002') || // Prisma unique constraint error
            message.includes('p2003')    // Prisma foreign key constraint error
        );
    }
}
