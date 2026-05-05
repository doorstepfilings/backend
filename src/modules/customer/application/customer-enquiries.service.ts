import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toEnquiryResource } from './customer.mapper';
import { EnquiryEntity } from '../infrastructure/persistence/enquiry.entity';
import { CreateEnquiryDto } from '../presentation/http/dto/create-enquiry.dto';

@Injectable()
export class CustomerEnquiriesService {
    constructor(
        @InjectRepository(EnquiryEntity)
        private readonly enquiriesRepository: Repository<EnquiryEntity>,
    ) {}

    async createEnquiry(data: CreateEnquiryDto) {
        const enquiry = await this.enquiriesRepository.save(
            this.enquiriesRepository.create({
                name: data.name.trim(),
                email: data.email.trim().toLowerCase(),
                phone: data.phone?.trim() || null,
                service: data.service?.trim() || null,
                message: data.message.trim(),
                status: 'pending',
            }),
        );

        return toEnquiryResource(enquiry);
    }
}
