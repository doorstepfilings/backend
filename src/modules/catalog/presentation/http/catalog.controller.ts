import { Controller, Get, Param } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { CatalogQueryService } from '../../application/catalog-query.service';

@Controller()
export class CatalogController {
    constructor(private readonly catalogQueryService: CatalogQueryService) {}

    @Get('services')
    async getCategories() {
        const categories = await this.catalogQueryService.getCategories();

        return successResponse(categories);
    }

    @Get('service/:slug')
    async getServiceBySlug(@Param('slug') slug: string) {
        const service = await this.catalogQueryService.getServiceBySlug(slug);

        return successResponse(service);
    }
}
