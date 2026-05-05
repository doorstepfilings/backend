import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEnquiriesService } from './application/customer-enquiries.service';
import { EnquiryEntity } from './infrastructure/persistence/enquiry.entity';
import { EnquiriesController } from './presentation/http/enquiries.controller';

@Module({
    imports: [TypeOrmModule.forFeature([EnquiryEntity])],
    controllers: [EnquiriesController],
    providers: [CustomerEnquiriesService],
    exports: [CustomerEnquiriesService],
})
export class CustomerModule {}
