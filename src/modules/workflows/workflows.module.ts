import { Module } from '@nestjs/common';
import { WorkflowAuditModule } from '../workflow-audit/workflow-audit.module';
import { WorkflowsService } from './application/workflows.service';

@Module({
  imports: [WorkflowAuditModule],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
