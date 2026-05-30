import { Module } from '@nestjs/common';
import { WorkflowAuditService } from './application/workflow-audit.service';

@Module({
  providers: [WorkflowAuditService],
  exports: [WorkflowAuditService],
})
export class WorkflowAuditModule {}
