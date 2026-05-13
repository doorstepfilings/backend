export function toEnquiryResource(enquiry: any) {
    return {
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        service: enquiry.service,
        message: enquiry.message,
        status: enquiry.status,
        created_at: enquiry.createdAt,
    };
}
