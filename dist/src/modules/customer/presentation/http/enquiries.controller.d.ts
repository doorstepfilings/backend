import { CustomerEnquiriesService } from '../../application/customer-enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
export declare class EnquiriesController {
    private readonly customerEnquiriesService;
    constructor(customerEnquiriesService: CustomerEnquiriesService);
    createEnquiry(data: CreateEnquiryDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
            service: string | null;
            message: string;
            status: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    createCustomerEnquiry(data: CreateEnquiryDto): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            name: string;
            email: string;
            phone: string | null;
            service: string | null;
            message: string;
            status: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
}
