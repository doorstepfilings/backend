import { AdminService, type AdminCategoryInput, type AdminServiceInput } from '../../application/admin.service';
import type { UpdateApplicationStatusInput } from '../../../operations/application/user-services.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        success: boolean;
        message: string;
        data: {
            total_users: number;
            pending_applications: number;
            total_revenue: any;
        };
    }>;
    getActivity(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            type: string;
            message: string;
            date: Date;
        }[];
    }>;
    getUsers(role?: string): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity[];
    }>;
    getRMs(): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity[];
    }>;
    getAccountants(): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity[];
    }>;
    storeUser(data: any): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    deleteUser(id: number): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
    assignRM(data: {
        user_id: number;
        rm_id: number | null;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    assignAccountant(data: {
        user_id: number;
        accountant_id: number | null;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    updateRole(id: number, role: string): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    getCategories(): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service-category.entity").ServiceCategoryEntity[];
    }>;
    storeCategory(data: AdminCategoryInput): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service-category.entity").ServiceCategoryEntity;
    }>;
    updateCategory(id: number, data: AdminCategoryInput): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service-category.entity").ServiceCategoryEntity;
    }>;
    deleteCategory(id: number): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
    getServices(): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service.entity").ServiceEntity[];
    }>;
    getService(id: number): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service.entity").ServiceEntity;
    }>;
    storeService(data: AdminServiceInput): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service.entity").ServiceEntity;
    }>;
    updateService(id: number, data: any): Promise<{
        success: boolean;
        message: string;
        data: import("../../../catalog/infrastructure/persistence/service.entity").ServiceEntity;
    }>;
    deleteService(id: number): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
    getEnquiries(): Promise<{
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
        }[];
    }>;
    updateEnquiryStatus(id: number, status: string): Promise<{
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
    deleteEnquiry(id: number): Promise<{
        success: boolean;
        message: string;
        data: null;
    }>;
    getServiceApplications(status?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        }[];
    }>;
    getServiceApplication(id: number): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    updateApplicationStatus(id: number, data: UpdateApplicationStatusInput): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    assignAccountantToService(id: number, accountantId: number): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    updateDocumentStatus(id: number, docId: number, data: {
        status: 'verified' | 'rejected';
        remark?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    uploadCertificate(id: number, file: {
        originalname: string;
    } | undefined): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_id: number;
            user: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            accountant: {
                id: number;
                name: string;
                email: string;
                mobile_number: string | null;
                referral_code: string | null;
                rm_id: number | null;
                accountant_id: number | null;
                role: string;
                rm_unique_id: string | null;
                accountant_unique_id: string | null;
                is_mobile_verified: boolean;
                address: string | null;
                city: string | null;
                state: string | null;
                pincode: string | null;
                created_at: Date;
                updated_at: Date;
                regional_manager: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    rm_unique_id: string | null;
                } | null;
                accountant: {
                    id: number;
                    name: string;
                    email: string;
                    mobile_number: string | null;
                    accountant_unique_id: string | null;
                } | null;
            } | null;
            service: {
                id: number;
                service_category_id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                long_description: string | null;
                link: string | null;
                price: string | null;
                faqs: unknown[] | Record<string, unknown>;
                pricing_plans: unknown[] | Record<string, unknown>;
                required_documents_list: unknown[] | Record<string, unknown>;
                extra_documents: unknown[] | Record<string, unknown>;
                admin_notes: string | null;
                category: {
                    id: number;
                    name: string;
                    slug: string;
                    description: string | null;
                    icon: string | null;
                } | null;
                documents: {
                    id: number;
                    service_id: number;
                    document_name: string | null;
                    name: string | null;
                    slug: string | null;
                    description: string | null;
                    document_type: string;
                    file_type: string;
                    max_size: number;
                    is_required: boolean;
                    sort_order: number;
                    metadata: Record<string, unknown> | null;
                }[];
            } | null;
            application_unique_id: string | null;
            status: string;
            payment_status: string;
            form_data: Record<string, unknown> | null;
            documents: Record<string, unknown> | null;
            request_documents: {
                id: number;
                document_type: string | null;
                document_category: string | null;
                document_name: string | null;
                service_document_id: number | null;
                source_document_id: number | null;
                file_name: string;
                file_url: string;
                file_size: number;
                mime_type: string;
                version: number;
                status: string;
                notes: string | null;
                is_final: boolean;
                uploaded_by: {
                    id: number;
                    name: string;
                } | null;
                created_at: Date;
                uploaded_at: Date;
            }[];
            amount: string | null;
            notes: string | null;
            revision_notes: string | null;
            ca_notes: string | null;
            update_note: string | null;
            rejection_reason: string | null;
            verified: boolean;
            certificate_url: string | null;
            submitted_to_ca_at: Date | null;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    getRegionalManagerDetails(id: number): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    getAccountantDetails(id: number): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
    getUserDetails(id: number): Promise<{
        success: boolean;
        message: string;
        data: import("../../../identity/infrastructure/persistence/user.entity").UserEntity;
    }>;
}
