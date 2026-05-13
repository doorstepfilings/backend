import { Module } from '@nestjs/common';
import { AdminController } from './presentation/http/admin.controller';
import { AdminService } from './application/admin.service';
import { OperationsModule } from '../operations/operations.module';
import { RMController } from './presentation/http/rm.controller';
import { RMService } from './application/rm.service';
import { AccountantController } from './presentation/http/accountant.controller';
import { AccountantService } from './application/accountant.service';

@Module({
    imports: [
        OperationsModule,
    ],
    controllers: [AdminController, RMController, AccountantController],
    providers: [AdminService, RMService, AccountantService],
})
export class BackofficeModule {}
