import { Body, Controller, Post } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { CustomerEnquiriesService } from '../../application/customer-enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Controller()
export class EnquiriesController {
    constructor(
        private readonly customerEnquiriesService: CustomerEnquiriesService,
    ) {}

    @Post('enquiries')
    async createEnquiry(@Body() data: CreateEnquiryDto) {
        const enquiry = await this.customerEnquiriesService.createEnquiry(data);
        return successResponse(
            enquiry,
            'Thank you for your enquiry. We will get back to you soon!',
        );
    }

    @Post('customer/enquiries')
    async createCustomerEnquiry(@Body() data: CreateEnquiryDto) {
        return this.createEnquiry(data);
    }
}
