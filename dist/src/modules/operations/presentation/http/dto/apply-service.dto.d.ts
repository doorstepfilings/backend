export type ApplyServiceFormData = {
    address?: string;
    appointment_request?: 'yes' | 'no';
    city?: string;
    email?: string;
    fullName?: string;
    notes?: string;
    phone?: string;
    pincode?: string;
    pricing_plan?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    state?: string;
};
export declare class ApplyServiceDto {
    service_id: number;
    form_data: ApplyServiceFormData;
    notes?: string;
}
