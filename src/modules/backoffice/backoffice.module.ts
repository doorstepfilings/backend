import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../identity/infrastructure/persistence/user.entity';
import { ServiceEntity } from '../catalog/infrastructure/persistence/service.entity';
import { ServiceCategoryEntity } from '../catalog/infrastructure/persistence/service-category.entity';
import { EnquiryEntity } from '../customer/infrastructure/persistence/enquiry.entity';
import { AdminController } from './presentation/http/admin.controller';
import { AdminService } from './application/admin.service';
import { OperationsModule } from '../operations/operations.module';
import { RMController } from './presentation/http/rm.controller';
import { RMService } from './application/rm.service';
import { AccountantController } from './presentation/http/accountant.controller';
import { AccountantService } from './application/accountant.service';
import { UserServiceEntity } from '../operations/infrastructure/persistence/user-service.entity';
import { ServiceRequestDocumentEntity } from '../operations/infrastructure/persistence/service-request-document.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            ServiceEntity,
            ServiceCategoryEntity,
            EnquiryEntity,
            UserServiceEntity,
            ServiceRequestDocumentEntity,
        ]),
        OperationsModule,
    ],
    controllers: [AdminController, RMController, AccountantController],
    providers: [AdminService, RMService, AccountantService],
})
export class BackofficeModule {}

