import { CatalogQueryService } from '../../application/catalog-query.service';
export declare class CatalogController {
    private readonly catalogQueryService;
    constructor(catalogQueryService: CatalogQueryService);
    getCategories(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            category: string;
            slug: string;
            icon: string | null;
            description: string | null;
            services: {
                id: number;
                name: string;
                slug: string;
                short_description: string | null;
                description: string | null;
                price: string | null;
                pricing_plans: Record<string, unknown> | unknown[] | null;
                faqs: Record<string, unknown> | unknown[] | null;
                required_documents_list: Record<string, unknown> | unknown[] | null;
                link: string | null;
            }[];
        }[];
    }>;
    getServiceBySlug(slug: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: number;
            service_category_id: number;
            name: string;
            slug: string;
            short_description: string | null;
            description: string | null;
            long_description: string | null;
            link: string | null;
            price: string | null;
            faqs: Record<string, unknown> | unknown[];
            pricing_plans: Record<string, unknown> | unknown[];
            required_documents_list: Record<string, unknown> | unknown[];
            extra_documents: Record<string, unknown> | unknown[];
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
        };
    }>;
}
