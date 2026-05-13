import { Module } from '@nestjs/common';
import { CustomerEnquiriesService } from './application/customer-enquiries.service';
import { EnquiriesController } from './presentation/http/enquiries.controller';

@Module({
    imports: [],
    controllers: [EnquiriesController],
    providers: [CustomerEnquiriesService],
    exports: [CustomerEnquiriesService],
})
export class CustomerModule {}
