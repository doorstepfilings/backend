"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toEnquiryResource = toEnquiryResource;
function toEnquiryResource(enquiry) {
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
//# sourceMappingURL=customer.mapper.js.map