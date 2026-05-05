import { EnquiryEntity } from '../infrastructure/persistence/enquiry.entity';

export function toEnquiryResource(enquiry: EnquiryEntity) {
    return {
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        service: enquiry.service,
        message: enquiry.message,
        status: enquiry.status,
        created_at: enquiry.createdAt,
        updated_at: enquiry.updatedAt,
    };
}
