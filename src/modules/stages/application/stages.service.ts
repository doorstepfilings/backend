import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkflowAuditService } from '../../workflow-audit/application/workflow-audit.service';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toStageResource } from './stage.mapper';

type StageInput = {
  color?: string;
  isActive?: boolean;
  name: string;
};

type StageUpdateInput = {
  color?: string;
  isActive?: boolean;
  name?: string;
};

@Injectable()
export class StagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowAuditService: WorkflowAuditService,
  ) {}

  async listStages() {
    const stages = await this.prisma.stage.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }, { id: 'asc' }],
    });

    return stages.map(toStageResource);
  }

  async listDefaultStages() {
    const stages = await this.prisma.stage.findMany({
      where: { isDefault: true },
      orderBy: [{ id: 'asc' }],
    });

    return stages.map(toStageResource);
  }

  async getStage(id: number) {
    const stage = await this.prisma.stage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return toStageResource(stage);
  }

  async createStage(data: StageInput, actorId: number) {
    const name = this.normalizeRequiredText(data.name, 'name');
    const slug = this.slugify(name);
    const color = this.normalizeColor(data.color);

    const existing = await this.prisma.stage.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('A stage with this name already exists');
    }

    const stage = await this.prisma.stage.create({
      data: {
        color,
        isActive: data.isActive ?? true,
        name,
        slug,
      },
    });

    await this.workflowAuditService.record({
      action: 'stage.create',
      actorId: this.normalizeInteger(actorId, 'actorId'),
      metadata: {
        color: stage.color,
        is_active: Boolean(stage.isActive),
      },
      serviceId: null,
      stageId: stage.id,
    });

    return toStageResource(stage);
  }

  async updateStage(id: number, data: StageUpdateInput, actorId: number) {
    const existing = await this.prisma.stage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Stage not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const name = this.normalizeRequiredText(data.name, 'name');
      const slug = this.slugify(name);
      const slugOwner = await this.prisma.stage.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (slugOwner && Number(slugOwner.id) !== Number(id)) {
        throw new BadRequestException(
          'A different stage is already using this name',
        );
      }

      updateData.name = name;
      updateData.slug = slug;
    }

    if (data.color !== undefined) {
      updateData.color = this.normalizeColor(data.color);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const stage = await this.prisma.stage.update({
      where: { id },
      data: updateData,
    });

    await this.workflowAuditService.record({
      action: 'stage.update',
      actorId: this.normalizeInteger(actorId, 'actorId'),
      metadata: {
        color: stage.color,
        is_active: Boolean(stage.isActive),
        name: stage.name,
      },
      serviceId: null,
      stageId: stage.id,
    });

    return toStageResource(stage);
  }

  async deleteStage(id: number, actorId: number) {
    const stage = await this.prisma.stage.findUnique({
      where: { id },
      select: { id: true, name: true, isDefault: true },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    if (stage.isDefault) {
      throw new BadRequestException('Default stages cannot be deleted');
    }

    const [serviceWorkflowUsageCount, defaultWorkflowUsageCount] =
      await Promise.all([
        this.prisma.serviceWorkflow.count({
          where: { stageId: id },
        }),
        this.countDefaultWorkflowUsage(id),
      ]);
    const usageCount = serviceWorkflowUsageCount + defaultWorkflowUsageCount;

    if (usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete a stage that is assigned to a service workflow',
      );
    }

    await this.prisma.stage.delete({
      where: { id },
    });

    await this.workflowAuditService.record({
      action: 'stage.delete',
      actorId: this.normalizeInteger(actorId, 'actorId'),
      metadata: {
        name: stage.name,
      },
      serviceId: null,
      stageId: id,
    });

    return true;
  }

  private normalizeRequiredText(value: unknown, fieldName: string) {
    const normalized = String(value ?? '').trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return normalized;
  }

  private normalizeColor(value: unknown) {
    const normalized = String(value ?? '#1d4ed8').trim();
    const candidate = normalized || '#1d4ed8';

    if (!/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(candidate)) {
      throw new BadRequestException('color must be a valid hex code');
    }

    return candidate.toLowerCase();
  }

  private normalizeInteger(value: unknown, fieldName: string) {
    const parsed =
      typeof value === 'number' ? value : Number(String(value ?? '').trim());

    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} must be a valid integer`);
    }

    return parsed;
  }

  private async countDefaultWorkflowUsage(stageId: number) {
    try {
      return await this.prisma.defaultServiceWorkflow.count({
        where: { stageId },
      });
    } catch (error) {
      if (this.isMissingDefaultWorkflowTableError(error)) {
        return 0;
      }

      throw error;
    }
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
    const message = String(candidate.message ?? '');

    return (
      candidate.code === 'P2021' &&
      (candidate.meta?.table === 'default_service_workflows' ||
        message.includes('default_service_workflows'))
    );
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
