import { Body, Controller, Post } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { EnquiriesService } from '../../application/enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Controller()
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Post('enquiries')
  async createEnquiry(@Body() data: CreateEnquiryDto) {
    const enquiry = await this.enquiriesService.createEnquiry(data);
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
