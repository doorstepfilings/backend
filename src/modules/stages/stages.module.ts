import { Module } from '@nestjs/common';
import { WorkflowAuditModule } from '../workflow-audit/workflow-audit.module';
import { StagesService } from './application/stages.service';

@Module({
  imports: [WorkflowAuditModule],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
