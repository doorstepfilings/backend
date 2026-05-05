import { Repository } from 'typeorm';
import { EnquiryEntity } from '../infrastructure/persistence/enquiry.entity';
import { CreateEnquiryDto } from '../presentation/http/dto/create-enquiry.dto';
export declare class CustomerEnquiriesService {
    private readonly enquiriesRepository;
    constructor(enquiriesRepository: Repository<EnquiryEntity>);
    createEnquiry(data: CreateEnquiryDto): Promise<{
        id: number;
        name: string;
        email: string;
        phone: string | null;
        service: string | null;
        message: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    }>;
}
