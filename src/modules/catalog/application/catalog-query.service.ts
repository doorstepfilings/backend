import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toServiceCategoryListItem, toServiceResource } from './catalog.mapper';
import { ServiceCategoryEntity } from '../infrastructure/persistence/service-category.entity';
import { ServiceEntity } from '../infrastructure/persistence/service.entity';

@Injectable()
export class CatalogQueryService {
    constructor(
        @InjectRepository(ServiceCategoryEntity)
        private readonly serviceCategoriesRepository: Repository<ServiceCategoryEntity>,
        @InjectRepository(ServiceEntity)
        private readonly servicesRepository: Repository<ServiceEntity>,
    ) {}

    async getCategories() {
        const categories = await this.serviceCategoriesRepository.find({
            relations: {
                services: true,
            },
            order: {
                sortOrder: 'ASC',
                services: {
                    name: 'ASC',
                },
            },
        });

        return categories.map(toServiceCategoryListItem);
    }

    async getServiceBySlug(slug: string) {
        const service = await this.servicesRepository.findOne({
            where: {
                slug,
            },
            relations: {
                category: true,
                documents: true,
            },
            order: {
                documents: {
                    sortOrder: 'ASC',
                },
            },
        });

        if (!service) {
            throw new NotFoundException('Service not found');
        }

        return toServiceResource(service);
    }
}
