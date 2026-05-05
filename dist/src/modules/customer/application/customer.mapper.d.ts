import { EnquiryEntity } from '../infrastructure/persistence/enquiry.entity';
export declare function toEnquiryResource(enquiry: EnquiryEntity): {
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
