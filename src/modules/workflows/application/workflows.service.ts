import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { WorkflowAuditService } from '../../workflow-audit/application/workflow-audit.service';
import { PrismaService } from '../../../shared/services/prisma.service';
import {
  toDefaultWorkflowResource,
  toServiceWorkflowResource,
} from './workflow.mapper';

export type WorkflowAssignInput = {
  isRequired?: boolean;
  position?: number;
  serviceId: number;
  stageId: number;
};

export type WorkflowReorderInput = {
  orderedWorkflowIds: number[];
  serviceId: number;
};

export type WorkflowUpdateInput = {
  isRequired?: boolean;
};

export type DefaultWorkflowTemplateItemInput = {
  isRequired?: boolean;
  position?: number;
  stageId: number;
};

export type ReplaceDefaultWorkflowInput = {
  items: DefaultWorkflowTemplateItemInput[];
};

export type ApplyDefaultWorkflowInput = {
  overwrite?: boolean;
  serviceIds?: number[];
};

const LEGACY_DEFAULT_WORKFLOW_STAGE_SLUGS = [
  'start',
  'review',
  'verification',
  'completed',
] as const;

const STATUS_TO_REMAP_STAGE_SLUGS: Record<string, string[]> = {
  applied: ['start'],
  paid: ['start'],
  payment_pending: ['start'],
  in_cart: ['start'],
  under_review: ['verification', 'review', 'start'],
  update_required: ['verification', 'review', 'start'],
  in_progress: ['review', 'verification', 'start'],
  submitted_to_ca: ['department-submission', 'review', 'verification', 'start'],
  approved: ['approved', 'completed'],
  cancelled: ['cancelled', 'start'],
  completed: ['completed', 'approved'],
  rejected: ['rejected', 'start'],
};

const CLOSED_USER_SERVICE_STATUSES = new Set([
  'approved',
  'completed',
  'cancelled',
  'rejected',
]);

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowAuditService: WorkflowAuditService,
  ) {}

  async listServiceWorkflows(serviceId: number) {
    await this.ensureServiceExists(serviceId);

    const workflows = await this.prisma.serviceWorkflow.findMany({
      where: {
        serviceId,
        position: { lt: 1000 },
      },
      include: { stage: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    return workflows.map(toServiceWorkflowResource);
  }

  async listDefaultWorkflow() {
    const workflows = await this.loadDefaultWorkflowTemplate();

    return workflows.map(toDefaultWorkflowResource);
  }

  async replaceDefaultWorkflow(
    data: ReplaceDefaultWorkflowInput,
    actorId: number,
  ) {
    const actor = this.normalizeInteger(actorId, 'actorId');
    const items = this.normalizeDefaultWorkflowItems(data.items);

    await this.ensureActiveStagesExist(items.map((item) => item.stageId));

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.defaultServiceWorkflow.deleteMany({});

        await tx.defaultServiceWorkflow.createMany({
          data: items.map((item, index) => ({
            isRequired: item.isRequired,
            position: index + 1,
            stageId: item.stageId,
          })),
        });

        await this.workflowAuditService.record(
          {
            action: 'workflow.default.replace',
            actorId: actor,
            metadata: {
              item_count: items.length,
              stage_ids: items.map((item) => item.stageId),
            },
            serviceId: null,
          },
          tx,
        );

        const saved = await this.loadDefaultWorkflowTemplate(tx);

        return saved.map(toDefaultWorkflowResource);
      });
    } catch (error) {
      if (this.isMissingDefaultWorkflowTableError(error)) {
        throw new ServiceUnavailableException(
          'Default workflow template storage is unavailable until the latest database migration is applied.',
        );
      }

      throw error;
    }
  }

  async applyDefaultWorkflow(data: ApplyDefaultWorkflowInput, actorId: number) {
    const actor = this.normalizeInteger(actorId, 'actorId');
    const overwrite = Boolean(data.overwrite);
    const requestedServiceIds = this.normalizeOptionalIntegerList(
      data.serviceIds,
      'serviceIds',
    );
    const template = await this.loadDefaultWorkflowTemplate();

    if (template.length === 0) {
      throw new BadRequestException('Default workflow template is empty');
    }

    const targetServices =
      requestedServiceIds.length > 0
        ? await this.prisma.service.findMany({
            where: { id: { in: requestedServiceIds } },
            select: { id: true, hasCustomWorkflow: true },
          })
        : await this.prisma.service.findMany({
            select: { id: true, hasCustomWorkflow: true },
          });

    if (requestedServiceIds.length > 0) {
      const foundServiceIds = new Set(
        targetServices.map((service) => Number(service.id)),
      );
      const missingIds = requestedServiceIds.filter(
        (serviceId) => !foundServiceIds.has(serviceId),
      );

      if (missingIds.length > 0) {
        throw new NotFoundException(
          `Services not found: ${missingIds.join(', ')}`,
        );
      }
    }

    const targetServiceIds = targetServices.map((service) =>
      Number(service.id),
    );

    if (targetServiceIds.length === 0) {
      return {
        applied_service_count: 0,
        applied_service_ids: [],
        blocked_service_ids: [],
        overwrite,
        requested_service_count: 0,
        skipped_service_count: 0,
        skipped_service_ids: [],
      };
    }

    const appliedServiceIds: number[] = [];
    const blockedServiceIds: number[] = [];
    const skippedServiceIds: number[] = [];

    for (const service of targetServices) {
      const serviceId = Number(service.id);
      await this.prisma.$transaction(async (tx) => {
        const currentServiceWorkflows = await tx.serviceWorkflow.findMany({
          where: { serviceId },
          select: { id: true },
        });
        const currentRequests = await tx.userService.findMany({
          where: { serviceId },
          select: {
            id: true,
            currentServiceWorkflowId: true,
            serviceId: true,
            status: true,
          },
        });

        if (currentServiceWorkflows.length > 0) {
          if (!overwrite) {
            skippedServiceIds.push(serviceId);
            return;
          }

          // Smart workflow overwrite update
          const existing = await tx.serviceWorkflow.findMany({
            where: { serviceId },
          });

          // Skip services whose workflow doesn't match the default template
          // (i.e. a custom, hand-crafted workflow — never auto-overwrite those)
          if (
            service.hasCustomWorkflow ||
            this.isCustomWorkflow(existing, template)
          ) {
            skippedServiceIds.push(serviceId);
            return;
          }

          await this.snapshotClosedRequestWorkflows(
            tx,
            serviceId,
            existing,
            currentRequests,
          );

          // Temporarily set position to negative to avoid unique key conflicts during reordering
          for (const item of existing) {
            await tx.serviceWorkflow.update({
              where: { id: item.id },
              data: { position: -item.position },
            });
          }

          // Process template stages: create or update positive positions
          const createdOrUpdatedIds = new Set<number>();
          for (const item of template) {
            const existingRecord = existing.find(
              (x) => Number(x.stageId) === Number(item.stageId),
            );

            if (existingRecord) {
              await tx.serviceWorkflow.update({
                where: { id: existingRecord.id },
                data: {
                  position: Number(item.position),
                  isRequired: Boolean(item.isRequired),
                },
              });
              createdOrUpdatedIds.add(existingRecord.id);
            } else {
              const created = await tx.serviceWorkflow.create({
                data: {
                  serviceId,
                  stageId: Number(item.stageId),
                  position: Number(item.position),
                  isRequired: Boolean(item.isRequired),
                },
              });
              createdOrUpdatedIds.add(created.id);
            }
          }

          // Handle removed stages
          const removedRecords = existing.filter(
            (x) => !createdOrUpdatedIds.has(x.id),
          );

          // Fetch the newly updated/created workflows (which are active: position > 0 and position < 1000)
          const newWorkflows = await tx.serviceWorkflow.findMany({
            where: {
              serviceId,
              position: { gt: 0, lt: 1000 },
            },
            include: { stage: true },
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
          });

          // Migrate active (in-progress) requests to the new workflow stages if their stage was removed or is invalid/null
          await this.propagateWorkflowChangeToActiveRequests(
            tx,
            currentRequests,
            removedRecords.map((r) => r.id),
            newWorkflows,
          );

          // Clean up or archive removed records
          for (const removed of removedRecords) {
            const referencedCount = await tx.userService.count({
              where: { currentServiceWorkflowId: removed.id },
            });

            if (referencedCount === 0) {
              await tx.serviceWorkflow.delete({
                where: { id: removed.id },
              });
            } else {
              // Move position out of active range (>= 1000) to keep reference intact for completed requests
              await tx.serviceWorkflow.update({
                where: { id: removed.id },
                data: {
                  position: 1000 + Math.abs(removed.position),
                },
              });
            }
          }
        } else {
          // If there are no existing workflows, just create them from template
          await this.createServiceWorkflowFromTemplate(tx, serviceId, template);
        }

        if (service.hasCustomWorkflow) {
          await tx.service.update({
            where: { id: serviceId },
            data: { hasCustomWorkflow: false },
          });
        }

        appliedServiceIds.push(serviceId);

        await this.workflowAuditService.record(
          {
            action:
              currentServiceWorkflows.length > 0
                ? 'workflow.default.replace-service'
                : 'workflow.default.apply-service',
            actorId: actor,
            metadata: {
              overwrite,
              source: 'default_template',
              stage_ids: template.map((item) => Number(item.stageId)),
            },
            serviceId,
          },
          tx,
        );
      });
    }

    return {
      applied_service_count: appliedServiceIds.length,
      applied_service_ids: appliedServiceIds,
      blocked_service_ids: blockedServiceIds,
      overwrite,
      requested_service_count: targetServiceIds.length,
      skipped_service_count:
        blockedServiceIds.length + skippedServiceIds.length,
      skipped_service_ids: skippedServiceIds,
    };
  }

  async applyDefaultWorkflowToService(
    serviceId: number,
    actorId: number,
    overwrite = false,
  ) {
    const templateCount = (await this.loadDefaultWorkflowTemplate()).length;

    if (templateCount === 0) {
      return {
        applied_service_count: 0,
        applied_service_ids: [],
        blocked_service_ids: [],
        overwrite,
        requested_service_count: 1,
        skipped_service_count: 1,
        skipped_service_ids: [this.normalizeInteger(serviceId, 'serviceId')],
      };
    }

    return this.applyDefaultWorkflow(
      {
        overwrite,
        serviceIds: [this.normalizeInteger(serviceId, 'serviceId')],
      },
      actorId,
    );
  }

  async ensureInitialWorkflowForRequests(userServiceIds: number[]) {
    const requestIds = this.normalizeOptionalIntegerList(
      userServiceIds,
      'userServiceIds',
    );

    if (requestIds.length === 0) {
      return 0;
    }

    return this.prisma.$transaction(async (tx) => {
      const userServices = await tx.userService.findMany({
        where: {
          currentServiceWorkflowId: null,
          id: { in: requestIds },
        },
        select: {
          id: true,
          serviceId: true,
        },
      });

      if (userServices.length === 0) {
        return 0;
      }

      const serviceIds = [
        ...new Set(userServices.map((service) => Number(service.serviceId))),
      ];
      const workflows = await tx.serviceWorkflow.findMany({
        where: {
          serviceId: { in: serviceIds },
          position: { lt: 1000 },
          stage: {
            isActive: true,
          },
        },
        orderBy: [{ serviceId: 'asc' }, { position: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          serviceId: true,
        },
      });
      const firstWorkflowByServiceId = new Map<number, number>();

      for (const workflow of workflows) {
        const serviceId = Number(workflow.serviceId);

        if (!firstWorkflowByServiceId.has(serviceId)) {
          firstWorkflowByServiceId.set(serviceId, Number(workflow.id));
        }
      }

      let updatedCount = 0;

      for (const userService of userServices) {
        const workflowId = firstWorkflowByServiceId.get(
          Number(userService.serviceId),
        );

        if (!workflowId) {
          continue;
        }

        const result = await tx.userService.updateMany({
          where: {
            currentServiceWorkflowId: null,
            id: Number(userService.id),
          },
          data: {
            currentServiceWorkflowId: workflowId,
            currentStageUpdatedAt: new Date(),
          },
        });

        updatedCount += Number(result.count ?? 0);
      }

      return updatedCount;
    });
  }

  async assignStageToService(data: WorkflowAssignInput, actorId: number) {
    console.log('Assigning workflow stage to service', { data, actorId });
    const serviceId = this.normalizeInteger(data.serviceId, 'serviceId');
    const stageId = this.normalizeInteger(data.stageId, 'stageId');
    const actor = this.normalizeInteger(actorId, 'actorId');
    await this.ensureServiceExists(serviceId);
    await this.ensureStageExists(stageId);

    return this.prisma.$transaction(async (tx) => {
      await this.snapshotClosedRequestWorkflows(tx, serviceId);

      const duplicate = await tx.serviceWorkflow.findFirst({
        where: {
          serviceId,
          stageId,
          position: { lt: 1000 },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'This stage is already assigned to the selected service',
        );
      }

      const existing = await tx.serviceWorkflow.findMany({
        where: {
          serviceId,
          position: { lt: 1000 },
        },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });

      const targetPosition = this.clampPosition(
        data.position,
        existing.length + 1,
      );

      await this.shiftPositionsForInsert(tx, serviceId, targetPosition);

      const created = await tx.serviceWorkflow.create({
        data: {
          isRequired: data.isRequired ?? true,
          position: targetPosition,
          serviceId,
          stageId,
        },
        include: { stage: true },
      });

      await this.workflowAuditService.record(
        {
          action: 'workflow.assign',
          actorId: actor,
          metadata: {
            is_required: Boolean(created.isRequired),
            position: Number(created.position),
          },
          serviceId,
          serviceWorkflowId: created.id,
          stageId,
        },
        tx,
      );

      await tx.service.update({
        where: { id: serviceId },
        data: { hasCustomWorkflow: true },
      });

      const newWorkflows = await tx.serviceWorkflow.findMany({
        where: { serviceId, position: { lt: 1000 }, stage: { isActive: true } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: { stage: true },
      });
      const currentRequests = await tx.userService.findMany({
        where: { serviceId },
        select: { id: true, status: true, currentServiceWorkflowId: true },
      });
      await this.propagateWorkflowChangeToActiveRequests(
        tx,
        currentRequests,
        [],
        newWorkflows,
        true,
      );

      return toServiceWorkflowResource(created);
    });
  }

  async reorderServiceWorkflows(data: WorkflowReorderInput, actorId: number) {
    const serviceId = this.normalizeInteger(data.serviceId, 'serviceId');
    const actor = this.normalizeInteger(actorId, 'actorId');
    await this.ensureServiceExists(serviceId);

    const orderedIds = Array.isArray(data.orderedWorkflowIds)
      ? data.orderedWorkflowIds.map((id) =>
          this.normalizeInteger(id, 'orderedWorkflowIds'),
        )
      : [];

    return this.prisma.$transaction(async (tx) => {
      await this.snapshotClosedRequestWorkflows(tx, serviceId);

      const existing = await tx.serviceWorkflow.findMany({
        where: {
          serviceId,
          position: { lt: 1000 },
        },
        include: { stage: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });

      const existingIds = existing.map((workflow) => Number(workflow.id));

      if (existingIds.length !== orderedIds.length) {
        throw new BadRequestException(
          'The reordered workflow list must include every assigned stage exactly once',
        );
      }

      const incomingKey = [...orderedIds]
        .sort((left, right) => left - right)
        .join(',');
      const existingKey = [...existingIds]
        .sort((left, right) => left - right)
        .join(',');

      if (incomingKey !== existingKey) {
        throw new BadRequestException(
          'The reordered workflow list contains invalid workflow items',
        );
      }

      for (let index = 0; index < orderedIds.length; index += 1) {
        await tx.serviceWorkflow.update({
          where: { id: orderedIds[index] },
          data: { position: -(index + 1) },
        });
      }

      for (let index = 0; index < orderedIds.length; index += 1) {
        await tx.serviceWorkflow.update({
          where: { id: orderedIds[index] },
          data: { position: index + 1 },
        });
      }

      await this.workflowAuditService.record(
        {
          action: 'workflow.reorder',
          actorId: actor,
          metadata: {
            ordered_workflow_ids: orderedIds,
          },
          serviceId,
        },
        tx,
      );

      const reordered = await tx.serviceWorkflow.findMany({
        where: { serviceId, position: { lt: 1000 } },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: { stage: true },
      });

      const currentRequests = await tx.userService.findMany({
        where: { serviceId },
        select: { id: true, status: true, currentServiceWorkflowId: true },
      });
      await this.propagateWorkflowChangeToActiveRequests(
        tx,
        currentRequests,
        [],
        reordered.filter((w) => w.stage?.isActive),
        true,
      );

      await tx.service.update({
        where: { id: serviceId },
        data: { hasCustomWorkflow: true },
      });

      return reordered.map(toServiceWorkflowResource);
    });
  }

  async updateWorkflow(
    workflowId: number,
    data: WorkflowUpdateInput,
    actorId: number,
  ) {
    const id = this.normalizeInteger(workflowId, 'workflowId');
    const actor = this.normalizeInteger(actorId, 'actorId');
    const workflow = await this.prisma.serviceWorkflow.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow item not found');
    }

    if (data.isRequired === undefined) {
      return toServiceWorkflowResource(workflow);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.snapshotClosedRequestWorkflows(tx, Number(workflow.serviceId));

      const nextWorkflow = await tx.serviceWorkflow.update({
        where: { id },
        data: {
          isRequired: data.isRequired,
        },
        include: { stage: true },
      });

      await this.workflowAuditService.record(
        {
          action: 'workflow.update-required',
          actorId: actor,
          metadata: {
            is_required: Boolean(nextWorkflow.isRequired),
          },
          serviceId: Number(nextWorkflow.serviceId),
          serviceWorkflowId: Number(nextWorkflow.id),
          stageId: Number(nextWorkflow.stageId),
        },
        tx,
      );

      return nextWorkflow;
    });

    return toServiceWorkflowResource(updated);
  }

  async deleteWorkflow(workflowId: number, actorId: number) {
    const id = this.normalizeInteger(workflowId, 'workflowId');
    const actor = this.normalizeInteger(actorId, 'actorId');
    const workflow = await this.prisma.serviceWorkflow.findUnique({
      where: { id },
      include: { stage: true },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow item not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.snapshotClosedRequestWorkflows(tx, Number(workflow.serviceId));

      await tx.serviceWorkflow.delete({
        where: { id },
      });

      await this.normalizeServiceWorkflowPositions(
        tx,
        Number(workflow.serviceId),
      );

      const remainingWorkflows = await tx.serviceWorkflow.findMany({
        where: {
          serviceId: Number(workflow.serviceId),
          position: { lt: 1000 },
        },
        include: { stage: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });

      const currentRequests = await tx.userService.findMany({
        where: { serviceId: Number(workflow.serviceId) },
        select: {
          id: true,
          currentServiceWorkflowId: true,
          status: true,
        },
      });

      await this.propagateWorkflowChangeToActiveRequests(
        tx,
        currentRequests,
        [id],
        remainingWorkflows,
      );

      await tx.service.update({
        where: { id: Number(workflow.serviceId) },
        data: { hasCustomWorkflow: true },
      });

      await this.workflowAuditService.record(
        {
          action: 'workflow.remove',
          actorId: actor,
          metadata: {
            deleted_position: Number(workflow.position),
          },
          serviceId: Number(workflow.serviceId),
          serviceWorkflowId: Number(workflow.id),
          stageId: Number(workflow.stageId),
        },
        tx,
      );
    });

    return true;
  }

  private async ensureServiceExists(serviceId: number) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }
  }

  private async ensureStageExists(stageId: number) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }
  }

  private async ensureActiveStagesExist(stageIds: number[]) {
    const uniqueStageIds = [...new Set(stageIds)];
    const stages = await this.prisma.stage.findMany({
      where: { id: { in: uniqueStageIds } },
      select: { id: true, isActive: true },
    });
    const stagesById = new Map(
      stages.map((stage) => [Number(stage.id), Boolean(stage.isActive)]),
    );
    const missingOrInactiveStageId = uniqueStageIds.find((stageId) => {
      const isActive = stagesById.get(stageId);
      return isActive !== true;
    });

    if (missingOrInactiveStageId) {
      throw new BadRequestException(
        `Stage ${missingOrInactiveStageId} is missing or inactive`,
      );
    }
  }

  private async loadDefaultWorkflowTemplate(
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    try {
      return await client.defaultServiceWorkflow.findMany({
        include: { stage: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      });
    } catch (error) {
      if (!this.isMissingDefaultWorkflowTableError(error)) {
        throw error;
      }

      return this.loadLegacyDefaultWorkflowTemplate(client);
    }
  }

  private async loadLegacyDefaultWorkflowTemplate(
    client: Prisma.TransactionClient | PrismaService,
  ) {
    const stages = await client.stage.findMany({
      where: {
        slug: {
          in: [...LEGACY_DEFAULT_WORKFLOW_STAGE_SLUGS],
        },
      },
    });
    const stageBySlug = new Map(
      stages.map((stage) => [String(stage.slug), stage]),
    );

    return LEGACY_DEFAULT_WORKFLOW_STAGE_SLUGS.map((slug, index) => {
      const stage = stageBySlug.get(slug);

      if (!stage) {
        return null;
      }

      return {
        id: Number(stage.id),
        stage,
        stageId: Number(stage.id),
        position: index + 1,
        isRequired: true,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private isCustomWorkflow(
    existing: Array<{ stageId: number; position: number }>,
    template: Array<{ stageId: number; position: number }>,
  ): boolean {
    const activeExisting = existing.filter(
      (x) => x.position > 0 && x.position < 1000,
    );
    if (activeExisting.length !== template.length) {
      return true;
    }
    const sortedExisting = [...activeExisting].sort(
      (a, b) => a.position - b.position,
    );
    const sortedTemplate = [...template].sort(
      (a, b) => a.position - b.position,
    );
    for (let i = 0; i < sortedExisting.length; i++) {
      if (
        Number(sortedExisting[i].stageId) !== Number(sortedTemplate[i].stageId)
      ) {
        return true;
      }
    }
    return false;
  }

  private isMissingDefaultWorkflowTableError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const candidate = error as {
      code?: unknown;
      message?: unknown;
      meta?: {
        table?: unknown;
      };
    };
    const message = typeof candidate.message === 'string' ? candidate.message : '';

    return (
      candidate.code === 'P2021' &&
      (candidate.meta?.table === 'default_service_workflows' ||
        message.includes('default_service_workflows'))
    );
  }

  private clampPosition(value: unknown, max: number) {
    const parsed = Number(value);
    const normalized = Number.isInteger(parsed) ? parsed : max;

    return Math.max(1, Math.min(normalized, max));
  }

  private normalizeInteger(value: unknown, fieldName: string) {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.trim())
          : Number(value);

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }

    return parsed;
  }

  private normalizeDefaultWorkflowItems(
    items: DefaultWorkflowTemplateItemInput[],
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'items must include at least one default workflow stage',
      );
    }

    const normalized = items.map((item, index) => ({
      isRequired: item.isRequired ?? true,
      position: this.normalizeOptionalPosition(item.position, index + 1),
      stageId: this.normalizeInteger(item.stageId, 'stageId'),
    }));
    const duplicateStageIds = normalized
      .map((item) => item.stageId)
      .filter((stageId, index, values) => values.indexOf(stageId) !== index);

    if (duplicateStageIds.length > 0) {
      throw new BadRequestException(
        'Default workflow stages must not contain duplicates',
      );
    }

    normalized.sort(
      (left, right) =>
        left.position - right.position || left.stageId - right.stageId,
    );

    return normalized.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  }

  private normalizeOptionalIntegerList(value: unknown, fieldName: string) {
    if (value === undefined || value === null) {
      return [];
    }

    if (!Array.isArray(value)) {
      throw new BadRequestException(`${fieldName} must be an array`);
    }

    return [
      ...new Set(value.map((item) => this.normalizeInteger(item, fieldName))),
    ];
  }

  private normalizeOptionalPosition(value: unknown, fallback: number) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    return this.normalizeInteger(value, 'position');
  }

  private async normalizeServiceWorkflowPositions(
    tx: Prisma.TransactionClient,
    serviceId: number,
  ) {
    const remaining = await tx.serviceWorkflow.findMany({
      where: {
        serviceId,
        position: { lt: 1000 },
      },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await tx.serviceWorkflow.update({
        where: { id: remaining[index].id },
        data: { position: index + 1 },
      });
    }
  }

  private async shiftPositionsForInsert(
    tx: Prisma.TransactionClient,
    serviceId: number,
    targetPosition: number,
  ) {
    const affected = await tx.serviceWorkflow.findMany({
      where: {
        serviceId,
        position: {
          gte: targetPosition,
          lt: 1000,
        },
      },
      orderBy: [{ position: 'desc' }, { id: 'desc' }],
    });

    for (const workflow of affected) {
      await tx.serviceWorkflow.update({
        where: { id: workflow.id },
        data: { position: Number(workflow.position) + 1 },
      });
    }
  }

  private async createServiceWorkflowFromTemplate(
    tx: Prisma.TransactionClient,
    serviceId: number,
    template: Array<{
      isRequired: boolean;
      position: number;
      stageId: number;
    }>,
  ) {
    if (template.length === 0) {
      return;
    }

    await tx.serviceWorkflow.createMany({
      data: template.map((item) => ({
        isRequired: Boolean(item.isRequired),
        position: Number(item.position),
        serviceId,
        stageId: Number(item.stageId),
      })),
    });
  }

  private async snapshotClosedRequestWorkflows(
    tx: Prisma.TransactionClient,
    serviceId: number,
    existingWorkflows?: Array<{
      id: number;
      isRequired?: boolean;
      position: number;
      serviceId: number;
      stageId: number;
    }>,
    existingRequests?: Array<{
      currentServiceWorkflowId?: number | null;
      id: number;
      status?: string | null;
    }>,
  ) {
    const workflows =
      existingWorkflows ??
      (await tx.serviceWorkflow.findMany({
        where: { serviceId },
      }));
    const activeWorkflows = workflows.filter((workflow) => {
      const position = Number(workflow.position);
      return position > 0 && position < 1000;
    });

    if (activeWorkflows.length === 0) {
      return;
    }

    const activeWorkflowIds = new Set(
      activeWorkflows.map((workflow) => Number(workflow.id)),
    );
    const requests =
      existingRequests ??
      (await tx.userService.findMany({
        where: { serviceId },
        select: {
          currentServiceWorkflowId: true,
          id: true,
          status: true,
        },
      }));
    const closedRequests = requests.filter((request) => {
      if (!this.isClosedUserServiceStatus(request.status)) {
        return false;
      }

      const workflowId = Number(request.currentServiceWorkflowId);
      return Number.isFinite(workflowId) && activeWorkflowIds.has(workflowId);
    });

    if (closedRequests.length === 0) {
      return;
    }

    const maxPosition = workflows.reduce((max, workflow) => {
      return Math.max(max, Number(workflow.position) || 0);
    }, 0);
    const archiveBlock = Math.max(
      1000,
      (Math.floor(maxPosition / 1000) + 1) * 1000,
    );
    const archivedWorkflowIdsBySourceId = new Map<number, number>();

    const orderedActiveWorkflows = [...activeWorkflows].sort(
      (left, right) =>
        Number(left.position) - Number(right.position) ||
        Number(left.id) - Number(right.id),
    );

    for (const workflow of orderedActiveWorkflows) {
      const archived = await tx.serviceWorkflow.create({
        data: {
          isRequired: Boolean(workflow.isRequired),
          position: archiveBlock + Number(workflow.position),
          serviceId: Number(workflow.serviceId),
          stageId: Number(workflow.stageId),
        },
        select: {
          id: true,
        },
      });

      archivedWorkflowIdsBySourceId.set(
        Number(workflow.id),
        Number(archived.id),
      );
    }

    for (const request of closedRequests) {
      const archivedWorkflowId = archivedWorkflowIdsBySourceId.get(
        Number(request.currentServiceWorkflowId),
      );

      if (!archivedWorkflowId) {
        continue;
      }

      await tx.userService.update({
        where: { id: Number(request.id) },
        data: {
          currentServiceWorkflowId: archivedWorkflowId,
        },
      });
    }
  }

  private findWorkflowIdForStatus(
    workflows: Array<{
      id: number;
      position?: number;
      stage?: {
        slug?: string | null;
      } | null;
    }>,
    status: string,
  ) {
    const normalizedStatus = String(status || '')
      .trim()
      .toLowerCase();
    const candidateSlugs = STATUS_TO_REMAP_STAGE_SLUGS[normalizedStatus] ?? [];

    for (const slug of candidateSlugs) {
      const match = workflows.find(
        (workflow) =>
          String(workflow.stage?.slug || '')
            .trim()
            .toLowerCase() === slug,
      );

      if (match) {
        return Number(match.id);
      }
    }

    const orderedWorkflows = [...workflows].sort(
      (left, right) =>
        Number(left.position ?? 0) - Number(right.position ?? 0) ||
        Number(left.id) - Number(right.id),
    );

    if (orderedWorkflows.length === 0) {
      return null;
    }

    if (['approved', 'completed'].includes(normalizedStatus)) {
      return Number(orderedWorkflows[orderedWorkflows.length - 1].id);
    }

    return Number(orderedWorkflows[0].id);
  }

  private async propagateWorkflowChangeToActiveRequests(
    tx: Prisma.TransactionClient,
    currentRequests: Array<{
      id: number;
      currentServiceWorkflowId?: number | null;
      status: string;
    }>,
    removedWorkflowIds: number[],
    newWorkflows: Array<{
      id: number;
      position?: number;
      stage?: { slug?: string | null } | null;
    }>,
    forceReevaluate = false,
  ) {
    const activeRequests = currentRequests.filter(
      (req) => !this.isClosedUserServiceStatus(req.status),
    );

    for (const activeRequest of activeRequests) {
      const currentId = activeRequest.currentServiceWorkflowId;
      const isRemoved = currentId && removedWorkflowIds.includes(currentId);

      if (isRemoved || !currentId || forceReevaluate) {
        const matchingWorkflowId = this.findWorkflowIdForStatus(
          newWorkflows,
          activeRequest.status,
        );

        if (matchingWorkflowId !== null && matchingWorkflowId !== currentId) {
          await tx.userService.update({
            where: { id: activeRequest.id },
            data: {
              currentStageUpdatedAt: new Date(),
              currentServiceWorkflowId: matchingWorkflowId,
            },
          });
        }
      }
    }
  }

  private isClosedUserServiceStatus(status: unknown) {
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';
    return CLOSED_USER_SERVICE_STATUSES.has(normalizedStatus);
  }
}
