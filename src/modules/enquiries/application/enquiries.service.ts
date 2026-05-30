import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toEnquiryResource } from './enquiries.mapper';
import { CreateEnquiryDto } from '../presentation/http/dto/create-enquiry.dto';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnquiry(data: CreateEnquiryDto) {
    const enquiry = await this.prisma.enquiry.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        service: data.service?.trim() || null,
        message: data.message.trim(),
        status: 'pending',
      },
    });

    return toEnquiryResource(enquiry);
  }
}
