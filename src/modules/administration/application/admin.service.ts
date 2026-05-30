import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';
import { hash } from 'bcryptjs';
import { UserServicesService } from '../../service-operations/application/user-services.service';
import { REVIEW_QUEUE_APPLICATION_STATUSES } from '../../service-operations/application/user-service-status';
import {
  INDIAN_RAILWAY_CITY_STATION_CODES,
  INDIAN_STATE_CODES,
  normalizeCodeLookupKey,
} from '../../../shared/data/india-codes';
import {
  getPaidPaymentStatusValues,
  HIDDEN_USER_SERVICE_STATUSES,
  USER_SERVICE_PAYMENT_PENDING_STATUS,
} from '../../service-operations/application/payment-status';
import { UniqueIDGenerator } from '../../../shared/utils/unique-id.generator';
import { NotificationService } from '../../notifications/notification.service';
import type {
  UpdateApplicationStatusInput,
  UpdateRequestStageInput,
} from '../../service-operations/application/user-services.service';
import { toUserServiceResource } from '../../service-operations/application/operations.mapper';
import { toEnquiryResource } from '../../enquiries/application/enquiries.mapper';
import {
  normalizeAdminCategoryInput,
  normalizeAdminServiceInput,
  toAdminCategoryResource,
  toAdminServiceResource,
} from './admin.mapper';
import { StagesService } from '../../stages/application/stages.service';
import type {
  ApplyDefaultWorkflowInput,
  ReplaceDefaultWorkflowInput,
  WorkflowAssignInput,
  WorkflowReorderInput,
  WorkflowUpdateInput,
} from '../../workflows/application/workflows.service';
import { WorkflowsService } from '../../workflows/application/workflows.service';

export type AdminCategoryInput = any;

export type AdminServiceInput = any;

export type CreateUserInput = {
  name: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  email: string;
  landmark?: string | null;
  password?: string;
  pincode?: string | null;
  role: string;
  mobile_number?: string;
  rm_id?: number;
  state?: string | null;
};

export type AssignRmInput = {
  user_id: number;
  rm_id: number | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  state?: string | null;
};

export type UpdateRoleInput = {
  role: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  landmark?: string | null;
  pincode?: string | null;
  state?: string | null;
};

// ─── India code lookups imported from src/shared/data/india-codes.ts ─────────
// (normalizeCodeLookupKey, INDIAN_STATE_CODES, INDIAN_RAILWAY_CITY_STATION_CODES)

@Injectable()
export class AdminService {
  private static readonly ACTIVE_SERVICE_TERMINAL_STATUSES = [
    'cancelled',
    'completed',
    'rejected',
  ];

  private static readonly MANAGEABLE_USER_ROLES = [
    'user',
    'admin',
    'super_admin',
    'regional_manager',
    'accountant',
  ] as const;

  private static readonly ENQUIRY_STATUSES = ['pending', 'responded', 'closed'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly userServicesService: UserServicesService,
    private readonly notificationService: NotificationService,
    private readonly stagesService: StagesService,
    private readonly workflowsService: WorkflowsService,
  ) {}

  private normalizeInteger(value: number | string, fieldName: string) {
    const parsed =
      typeof value === 'number' ? value : Number(String(value).trim());

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }

    return parsed;
  }

  private normalizeOptionalString(value: unknown) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
  }

  // ─── User Management ──────────────────────────────────────────────────────

  async getUsers(role?: string) {
    return this.stripSensitiveFields(
      (await this.prisma.user.findMany({
        where: role ? { role } : {},
        include: { regionalManager: true, accountant: true },
        orderBy: { createdAt: 'desc' },
      })) as any[],
    );
  }

  async getRMs() {
    const rms = await this.prisma.user.findMany({
      where: { role: 'regional_manager' },
      include: {
        _count: {
          select: { assignedUsers: true },
        },
      },
    });

    return this.stripSensitiveFields(
      rms.map((rm) => ({
        ...rm,
        assigned_users_count: rm._count.assignedUsers,
      })),
    );
  }

  async getAccountants() {
    const accountants = await this.prisma.user.findMany({
      where: { role: 'accountant' },
      include: {
        _count: {
          select: { assignedAccountants: true },
        },
      },
    });

    return this.stripSensitiveFields(
      accountants.map((acc) => ({
        ...acc,
        assigned_users_count: acc._count.assignedAccountants,
      })),
    );
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

    const userData: Prisma.UserUncheckedCreateInput = {
      ...this.buildLocationPatch(data),
      name: data.name,
      email,
      password: hashedPassword,
      role: data.role,
      mobileNumber: data.mobile_number,
      rmId: data.rm_id || null,
    };

    if (data.role === 'accountant') {
      userData.accountantUniqueId =
        UniqueIDGenerator.generateUserUniqueID('accountant');
    }

    const saved =
      data.role === 'regional_manager'
        ? await this.createRegionalManagerUser(userData)
        : await this.prisma.user.create({ data: userData });

    // Send welcome email
    await this.notificationService.sendWelcomeNotification(saved);

    return this.stripSensitiveFields(saved);
  }

  async deleteUser(id: number) {
    id = this.normalizeInteger(id, 'user_id');

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

    if (user.role === 'accountant' && user.assignedAccountants.length > 0) {
      throw new BadRequestException(
        'Cannot delete Accountant with assigned users. Please reassign first.',
      );
    }

    await this.prisma.user.delete({ where: { id } });
  }

  async assignRM(data: AssignRmInput) {
    const userId = this.normalizeInteger(data.user_id, 'user_id');
    const rmId =
      data.rm_id === null ||
      data.rm_id === undefined ||
      data.rm_id === ('' as any)
        ? null
        : this.normalizeInteger(data.rm_id, 'rm_id');

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
      return this.stripSensitiveFields(
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...this.buildLocationPatch(data),
            rmId,
          },
        }),
      );
    } else {
      return this.stripSensitiveFields(
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...this.buildLocationPatch(data),
            rmId: null,
          },
        }),
      );
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
      throw new BadRequestException('Accountant can only be assigned to users');
    }

    if (accountantId) {
      const accountant = (await this.prisma.user.findFirstOrThrow({
        where: { id: accountantId, role: 'accountant' },
      })) as any;

      // Sync active services with the new accountant
      await this.prisma.userService.updateMany({
        where: {
          userId,
          status: {
            notIn: [
              ...AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES,
              'in_cart',
              USER_SERVICE_PAYMENT_PENDING_STATUS,
            ],
          },
        },
        data: { accountantId },
      });

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { accountantId },
      });

      // Notify the accountant
      await this.notificationService
        .sendAccountantAssignmentNotification(accountant, user as any)
        .catch((err) =>
          console.error('[AdminService] Failed to notify accountant:', err),
        );

      return this.stripSensitiveFields(updatedUser);
    } else {
      await this.prisma.userService.updateMany({
        where: {
          userId,
          status: {
            notIn: [
              ...AdminService.ACTIVE_SERVICE_TERMINAL_STATUSES,
              'in_cart',
              USER_SERVICE_PAYMENT_PENDING_STATUS,
            ],
          },
        },
        data: { accountantId: null },
      });

      return this.stripSensitiveFields(
        await this.prisma.user.update({
          where: { id: userId },
          data: { accountantId: null },
        }),
      );
    }
  }

  async updateRole(id: number, data: UpdateRoleInput) {
    id = this.normalizeInteger(id, 'user_id');
    const role = String(data.role ?? '').trim();

    if (!AdminService.MANAGEABLE_USER_ROLES.includes(role as any)) {
      throw new BadRequestException('Invalid role selected');
    }

    const user = (await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        _count: {
          select: {
            assignedAccountants: true,
            assignedUsers: true,
          },
        },
      },
    })) as any;

    if (user.role === 'super_admin' && role !== 'super_admin') {
      throw new BadRequestException('Super admin role cannot be changed');
    }

    if (user.role === role) {
      return this.stripSensitiveFields(user);
    }

    if (
      user.role === 'regional_manager' &&
      role !== 'regional_manager' &&
      Number(user._count?.assignedUsers ?? 0) > 0
    ) {
      throw new BadRequestException(
        'Cannot move this RM to another role while clients are still assigned. Reassign or remove those clients first.',
      );
    }

    if (
      user.role === 'accountant' &&
      role !== 'accountant' &&
      Number(user._count?.assignedAccountants ?? 0) > 0
    ) {
      throw new BadRequestException(
        'Cannot move this accountant to another role while clients are still assigned. Reassign or remove those clients first.',
      );
    }

    const updateData: any = {
      role,
      ...this.buildLocationPatch(data),
    };
    if (role !== 'user') {
      updateData.rmId = null;
      updateData.accountantId = null;
    }

    if (user.role === 'regional_manager' && role !== 'regional_manager') {
      updateData.rmUniqueId = null;
    }

    if (user.role === 'accountant' && role !== 'accountant') {
      updateData.accountantUniqueId = null;
    }

    // Auto-generate unique IDs on role promotion
    if (role === 'regional_manager') {
      const locationData = this.resolveRegionalManagerLocation({
        state: updateData.state !== undefined ? updateData.state : user.state,
        district:
          updateData.district !== undefined
            ? updateData.district
            : user.district,
        city: updateData.city !== undefined ? updateData.city : user.city,
      });
      updateData.rmUniqueId = await this.generateRegionalManagerUniqueId(
        locationData.state,
        locationData.cityCodeSource,
      );
    } else if (role === 'accountant') {
      updateData.accountantUniqueId =
        UniqueIDGenerator.generateUserUniqueID('accountant');
    }

    return this.stripSensitiveFields(
      await this.prisma.user.update({
        where: { id },
        data: updateData,
      }),
    );
  }

  // ─── Category Management ──────────────────────────────────────────────────

  async getCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) =>
      toAdminCategoryResource({
        ...cat,
        services_count: cat._count.services,
      }),
    );
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
        },
      });
      return toAdminCategoryResource(saved);
    } catch (error) {
      this.rethrowFriendlyConstraintError(error, 'Category');
      throw error;
    }
  }

  async updateCategory(id: number, data: AdminCategoryInput) {
    id = this.normalizeInteger(id, 'category_id');

    const normalized = normalizeAdminCategoryInput(data);
    const updateData: any = { ...normalized };

    if (normalized.name) {
      updateData.slug = this.slugify(normalized.name);
    }

    try {
      const saved = await this.prisma.serviceCategory.update({
        where: { id },
        data: updateData,
      });
      return toAdminCategoryResource(saved);
    } catch (error) {
      this.rethrowFriendlyConstraintError(error, 'Category');
      throw error;
    }
  }

  async deleteCategory(id: number) {
    id = this.normalizeInteger(id, 'category_id');

    const category = await this.prisma.serviceCategory.findUniqueOrThrow({
      where: { id },
      include: { services: true },
    });
    if (category.services.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with existing services',
      );
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
    id = this.normalizeInteger(id, 'service_id');

    const service = await this.prisma.service.findUniqueOrThrow({
      where: { id },
      include: { category: true, documents: true },
    });

    return toAdminServiceResource(service);
  }

  async storeService(data: AdminServiceInput, actorId?: number) {
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
        },
      });

      return this.getService(saved.id);
    } catch (error) {
      this.rethrowFriendlyConstraintError(error, 'Service');
      throw error;
    }
  }

  async updateService(id: number, data: AdminServiceInput) {
    id = this.normalizeInteger(id, 'service_id');

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
        data: updateData,
      });
      return this.getService(id);
    } catch (error) {
      this.rethrowFriendlyConstraintError(error, 'Service');
      throw error;
    }
  }

  async deleteService(id: number) {
    id = this.normalizeInteger(id, 'service_id');

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

  async listStages() {
    return this.stagesService.listStages();
  }

  async listDefaultStages() {
    return this.stagesService.listDefaultStages();
  }

  async getStage(id: number) {
    return this.stagesService.getStage(this.normalizeInteger(id, 'stage_id'));
  }

  async createStage(
    data: { color?: string; isActive?: boolean; name: string },
    actorId: number,
  ) {
    return this.stagesService.createStage(data, actorId);
  }

  async updateStage(
    id: number,
    data: { color?: string; isActive?: boolean; name?: string },
    actorId: number,
  ) {
    return this.stagesService.updateStage(
      this.normalizeInteger(id, 'stage_id'),
      data,
      actorId,
    );
  }

  async deleteStage(id: number, actorId: number) {
    await this.stagesService.deleteStage(
      this.normalizeInteger(id, 'stage_id'),
      actorId,
    );
  }

  async listServiceWorkflows(serviceId: number) {
    return this.workflowsService.listServiceWorkflows(
      this.normalizeInteger(serviceId, 'service_id'),
    );
  }

  async listDefaultWorkflow() {
    return this.workflowsService.listDefaultWorkflow();
  }

  async replaceDefaultWorkflow(
    data: ReplaceDefaultWorkflowInput,
    actorId: number,
  ) {
    return this.workflowsService.replaceDefaultWorkflow(data, actorId);
  }

  async applyDefaultWorkflow(data: ApplyDefaultWorkflowInput, actorId: number) {
    return this.workflowsService.applyDefaultWorkflow(data, actorId);
  }

  async assignWorkflowStage(data: WorkflowAssignInput, actorId: number) {
    return this.workflowsService.assignStageToService(data, actorId);
  }

  async reorderServiceWorkflows(data: WorkflowReorderInput, actorId: number) {
    return this.workflowsService.reorderServiceWorkflows(data, actorId);
  }

  async updateServiceWorkflow(
    workflowId: number,
    data: WorkflowUpdateInput,
    actorId: number,
  ) {
    return this.workflowsService.updateWorkflow(
      this.normalizeInteger(workflowId, 'workflow_id'),
      data,
      actorId,
    );
  }

  async deleteServiceWorkflow(workflowId: number, actorId: number) {
    await this.workflowsService.deleteWorkflow(
      this.normalizeInteger(workflowId, 'workflow_id'),
      actorId,
    );
  }

  // ─── Enquiry Management ───────────────────────────────────────────────────

  async getEnquiries() {
    const enquiries = await this.prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return enquiries.map(toEnquiryResource);
  }

  async updateEnquiryStatus(id: number, status: string) {
    id = this.normalizeInteger(id, 'enquiry_id');

    if (!AdminService.ENQUIRY_STATUSES.includes(status)) {
      throw new BadRequestException('Invalid enquiry status');
    }

    const saved = await this.prisma.enquiry.update({
      where: { id },
      data: { status },
    });
    return toEnquiryResource(saved);
  }

  async deleteEnquiry(id: number) {
    id = this.normalizeInteger(id, 'enquiry_id');

    await this.prisma.enquiry.delete({ where: { id } });
  }


  // ─── Application Management ───────────────────────────────────────────────

  async getAllServiceApplications(status?: string) {
    return this.userServicesService.getAllServices(status);
  }

  async getServiceApplication(id: number) {
    id = this.normalizeInteger(id, 'application_id');

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
    await this.userServicesService.populateStageProgress(userService);

    return toUserServiceResource(userService);
  }

  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusInput,
  ) {
    id = this.normalizeInteger(id, 'application_id');
    const result = await this.userServicesService.updateApplicationStatus(
      id,
      data,
    );

    // Send finalized notification if marked completed/approved
    if (data.status === 'completed' || data.status === 'approved') {
      const userService = (await this.prisma.userService.findUnique({
        where: { id },
        include: { user: true, service: true },
      })) as any;
      if (userService?.user) {
        await this.notificationService
          .sendServiceFinalizedNotification(userService.user, userService)
          .catch((err) =>
            console.error('[AdminService] Notification error:', err),
          );
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

    const result = await this.userServicesService.assignAccountantToService(
      id,
      accountantId,
    );

    // Notify accountant
    const userService = (await this.prisma.userService.findUnique({
      where: { id },
      include: { user: true, service: true },
    })) as any;
    if (userService) {
      await this.notificationService
        .sendServiceAssignmentNotification(accountant, userService)
        .catch((err) =>
          console.error('[AdminService] Notification error:', err),
        );
    }

    return result;
  }

  async updateApplicationStage(id: number, data: UpdateRequestStageInput) {
    id = this.normalizeInteger(id, 'application_id');
    return this.userServicesService.updateRequestStage(id, data);
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
    id = this.normalizeInteger(id, 'rm_id');

    const rm = (await this.prisma.user.findFirstOrThrow({
      where: { id, role: 'regional_manager' },
      include: { assignedUsers: { include: { accountant: true } } },
    })) as any;

    const managedUserIds = Array.isArray(rm.assignedUsers)
      ? rm.assignedUsers.map((u: any) => u.id)
      : [];

    const activeServicesCount =
      managedUserIds.length > 0
        ? await this.prisma.userService.count({
            where: {
              userId: { in: managedUserIds },
              paymentStatus: { in: getPaidPaymentStatusValues() },
              status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
            },
          })
        : 0;

    const totalRevenueResult =
      managedUserIds.length > 0
        ? await this.prisma.userService.aggregate({
            where: {
              userId: { in: managedUserIds },
              paymentStatus: { in: getPaidPaymentStatusValues() },
              status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
            },
            _sum: { amount: true },
          })
        : { _sum: { amount: 0 } };

    rm.active_services_count = activeServicesCount;
    rm.total_revenue = Number(totalRevenueResult._sum.amount ?? 0);
    rm.performance_score = this.calculateRmPerformanceScore(
      rm.assignedUsers.length,
      0,
    );

    return this.stripSensitiveFields(rm);
  }

  async getAccountantDetails(id: number) {
    id = this.normalizeInteger(id, 'accountant_id');

    const accountant = (await this.prisma.user.findFirstOrThrow({
      where: { id, role: 'accountant' },
      include: { assignedAccountants: { include: { regionalManager: true } } },
    })) as any;

    const services = await this.prisma.userService.findMany({
      where: {
        accountantId: id,
        paymentStatus: { in: getPaidPaymentStatusValues() },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      include: {
        user: { include: { regionalManager: true } },
        service: { include: { category: true } },
      },
    });

    const totalRevenueResult = await this.prisma.userService.aggregate({
      where: {
        accountantId: id,
        paymentStatus: { in: getPaidPaymentStatusValues() },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      _sum: { amount: true },
    });

    accountant.services = services;
    accountant.active_services_count = services.length;
    accountant.total_revenue = Number(totalRevenueResult._sum.amount ?? 0);
    accountant.completion_rate =
      this.calculateAccountantCompletionRate(services);
    accountant.performance_score = this.calculateAccountantPerformanceScore(
      services.length,
      accountant.completion_rate,
    );

    return this.stripSensitiveFields(accountant);
  }

  async getUserDetails(id: number) {
    id = this.normalizeInteger(id, 'user_id');

    return this.stripSensitiveFields(
      await this.prisma.user.findUniqueOrThrow({
        where: { id },
        include: {
          regionalManager: true,
          accountant: true,
          assignedUsers: true,
          assignedAccountants: true,
        },
      }),
    );
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private calculateRmPerformanceScore(
    userCount: number,
    accountantCount: number,
  ) {
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

  private calculateAccountantPerformanceScore(
    userCount: number,
    completionRate: number,
  ) {
    const score = completionRate * 0.5 + userCount * 2;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Needs Improvement';
    return 'Inactive';
  }


  async getStats() {
    const totalUsers = await this.prisma.user.count({
      where: { role: 'user' },
    });
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
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
        paymentStatus: { in: getPaidPaymentStatusValues() },
      },
      _sum: { amount: true },
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
      where: {
        paymentStatus: { in: getPaidPaymentStatusValues() },
        status: { notIn: [...HIDDEN_USER_SERVICE_STATUSES] },
      },
      include: { user: true, service: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Map them into a unified activity feed format
    const activities = [
      ...(Array.isArray(recentUsers) ? recentUsers : []).map((u) => ({
        id: `user-${u.id}`,
        type: 'new_user',
        message: `New user registered: ${u.name}`,
        date: u.createdAt,
      })),
      ...(Array.isArray(recentServices) ? recentServices : []).map((s) => ({
        id: `service-${s.id}`,
        type: 'service_applied',
        message: `${s.user?.name || 'User'} applied for ${s.service?.name || 'a service'}`,
        date: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return activities;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
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
      message.includes('p2003') // Prisma foreign key constraint error
    );
  }

  private buildLocationPatch(input: {
    address?: unknown;
    city?: unknown;
    district?: unknown;
    landmark?: unknown;
    pincode?: unknown;
    state?: unknown;
  }) {
    const patch: Record<string, string | null> = {};
    const locationEntries = {
      address: this.normalizeOptionalString(input.address),
      city: this.normalizeOptionalString(input.city),
      district: this.normalizeOptionalString(input.district),
      landmark: this.normalizeOptionalString(input.landmark),
      pincode: this.normalizeOptionalString(input.pincode),
      state: this.normalizeOptionalString(input.state),
    };

    for (const [key, value] of Object.entries(locationEntries)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    return patch;
  }

  private resolveRegionalManagerLocation(input: {
    city?: string | null;
    district?: string | null;
    state?: string | null;
  }) {
    const state = this.normalizeOptionalString(input.state);
    const city = this.normalizeOptionalString(input.city);
    const district = this.normalizeOptionalString(input.district);

    if (!state) {
      throw new BadRequestException('State is required to generate the RM ID');
    }

    return {
      cityCodeSource: city ?? district ?? state,
      state,
    };
  }

  private async createRegionalManagerUser(
    userData: Prisma.UserUncheckedCreateInput,
  ) {
    const location = this.resolveRegionalManagerLocation({
      city: userData.city,
      district: userData.district,
      state: userData.state,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const rmUniqueId = await this.generateRegionalManagerUniqueId(
        location.state,
        location.cityCodeSource,
      );

      try {
        return await this.prisma.user.create({
          data: {
            ...userData,
            rmUniqueId,
          },
        });
      } catch (error) {
        if (this.isRegionalManagerUniqueConstraintError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException(
      'Unable to generate a unique RM ID right now. Please try again.',
    );
  }

  private async generateRegionalManagerUniqueId(state: string, city: string) {
    const stateCode = this.resolveStateCode(state);
    const cityCode = this.resolveCityCode(city);
    const prefix = `${stateCode}-${cityCode}-`;
    const latestMatch = await this.prisma.user.findFirst({
      where: {
        role: 'regional_manager',
        rmUniqueId: {
          startsWith: prefix,
        },
      },
      orderBy: {
        rmUniqueId: 'desc',
      },
      select: {
        rmUniqueId: true,
      },
    });
    const lastSequence = latestMatch?.rmUniqueId
      ? Number(String(latestMatch.rmUniqueId).split('-').pop() ?? 0)
      : 0;

    return `${prefix}${String(lastSequence + 1).padStart(4, '0')}`;
  }

  private resolveStateCode(state: string) {
    // Use the same normalizer used when the map was built so that
    // misspellings, extra spaces, accents, etc. all resolve correctly.
    const normalizedState = normalizeCodeLookupKey(state);
    const mapped = INDIAN_STATE_CODES[normalizedState];

    if (mapped) {
      return mapped;
    }

    // Fallback: strip non-alpha chars and take first 2 letters uppercased.
    const fallback = normalizedState.replace(/[^a-z]/g, '').toUpperCase();
    return (fallback.slice(0, 2) || 'ST').padEnd(2, 'X');
  }

  private resolveCityCode(city: string) {
    // Prefer the official Indian Railway station code.
    const normalizedCity = normalizeCodeLookupKey(city);
    const railwayCode = INDIAN_RAILWAY_CITY_STATION_CODES[normalizedCity];
    if (railwayCode) {
      return railwayCode;
    }

    // Fallback: take first 3 alphanumeric characters uppercased.
    const fallback = String(city)
      .trim()
      .replace(/[^a-z0-9]/gi, '')
      .toUpperCase();

    return (fallback.slice(0, 3) || 'CTY').padEnd(3, 'X');
  }

  private isRegionalManagerUniqueConstraintError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      code?: unknown;
      meta?: {
        target?: unknown;
      };
      message?: unknown;
    };
    const rawTargets = candidate.meta?.target;
    const targets = Array.isArray(rawTargets)
      ? rawTargets.map((target) => String(target))
      : [String(rawTargets ?? '')];
    const message = String(candidate.message ?? '').toLowerCase();

    return (
      candidate.code === 'P2002' &&
      (targets.some((target) => target.includes('rm_unique_id')) ||
        message.includes('rm_unique_id'))
    );
  }

  private stripSensitiveFields<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripSensitiveFields(item)) as T;
    }

    if (!value || typeof value !== 'object' || value instanceof Date) {
      return value;
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === 'password') {
        continue;
      }

      sanitized[key] = this.stripSensitiveFields(nestedValue);
    }

    return sanitized as T;
  }
}
