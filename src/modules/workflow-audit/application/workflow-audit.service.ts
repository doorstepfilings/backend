import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/services/prisma.service';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

type WorkflowAuditInput = {
  action: string;
  actorId: number;
  metadata?: Prisma.InputJsonValue | null;
  serviceId?: number | null;
  serviceWorkflowId?: number | null;
  stageId?: number | null;
};

@Injectable()
export class WorkflowAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: WorkflowAuditInput, tx?: PrismaExecutor) {
    const client = tx ?? this.prisma;

    await client.workflowAuditLog.create({
      data: {
        action: input.action,
        actorId: input.actorId,
        metadata: input.metadata ?? Prisma.JsonNull,
        serviceId: input.serviceId ?? null,
        serviceWorkflowId: input.serviceWorkflowId ?? null,
        stageId: input.stageId ?? null,
      },
    });
  }
}
