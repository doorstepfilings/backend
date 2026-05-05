import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnquiryEntity } from '../customer/infrastructure/persistence/enquiry.entity';
import { ServiceEntity } from '../catalog/infrastructure/persistence/service.entity';
import { UserEntity } from '../identity/infrastructure/persistence/user.entity';
import { CartService } from './application/cart.service';
import { UserServicesService } from './application/user-services.service';
import { SlotsService } from './application/slots.service';
import { UserServiceEntity } from './infrastructure/persistence/user-service.entity';
import { ServiceRequestDocumentEntity } from './infrastructure/persistence/service-request-document.entity';
import { PaymentEntity } from './infrastructure/persistence/payment.entity';
import { CartController } from './presentation/http/cart.controller';
import { UserServicesController } from './presentation/http/user-services.controller';
import { SlotsController } from './presentation/http/slots.controller';
import { PaymentController } from './presentation/http/payment.controller';
import { PaymentService } from './application/payment.service';
import { DocumentUploadService } from './application/document-upload.service';
import { PaymentWebhookController } from './presentation/http/payment-webhook.controller';

import { UserOrdersController } from './presentation/http/user-orders.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserServiceEntity,
            ServiceRequestDocumentEntity,
            PaymentEntity,
            ServiceEntity,
            UserEntity,
            EnquiryEntity,
        ]),
    ],
    controllers: [
        CartController,
        UserServicesController,
        SlotsController,
        PaymentController,
        PaymentWebhookController,
        UserOrdersController,
    ],
    providers: [
        CartService,
        UserServicesService,
        SlotsService,
        PaymentService,
        DocumentUploadService,
    ],
    exports: [
        CartService,
        UserServicesService,
        SlotsService,
        PaymentService,
        DocumentUploadService,
    ],
})
export class OperationsModule {}
