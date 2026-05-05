import { ServiceEntity } from './service.entity';
export declare class ServiceCategoryEntity {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    isActive: boolean;
    sortOrder: number;
    services: ServiceEntity[];
}
