import { Module } from '@nestjs/common';
import { AdminController } from './presentation/http/admin.controller';
import { AdminService } from './application/admin.service';
import { ServiceOperationsModule } from '../service-operations/service-operations.module';
import { RMController } from './presentation/http/rm.controller';
import { RMService } from './application/rm.service';
import { AccountantController } from './presentation/http/accountant.controller';
import { AccountantService } from './application/accountant.service';
import { StagesModule } from '../stages/stages.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { WorkflowAuditModule } from '../workflow-audit/workflow-audit.module';

@Module({
  imports: [
    WorkflowAuditModule,
    ServiceOperationsModule,
    StagesModule,
    WorkflowsModule,
  ],
  controllers: [AdminController, RMController, AccountantController],
  providers: [AdminService, RMService, AccountantService],
})
export class AdministrationModule {}
