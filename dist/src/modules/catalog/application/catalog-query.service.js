"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogQueryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const catalog_mapper_1 = require("./catalog.mapper");
const service_category_entity_1 = require("../infrastructure/persistence/service-category.entity");
const service_entity_1 = require("../infrastructure/persistence/service.entity");
let CatalogQueryService = class CatalogQueryService {
    serviceCategoriesRepository;
    servicesRepository;
    constructor(serviceCategoriesRepository, servicesRepository) {
        this.serviceCategoriesRepository = serviceCategoriesRepository;
        this.servicesRepository = servicesRepository;
    }
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
        return categories.map(catalog_mapper_1.toServiceCategoryListItem);
    }
    async getServiceBySlug(slug) {
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
            throw new common_1.NotFoundException('Service not found');
        }
        return (0, catalog_mapper_1.toServiceResource)(service);
    }
};
exports.CatalogQueryService = CatalogQueryService;
exports.CatalogQueryService = CatalogQueryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_category_entity_1.ServiceCategoryEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.ServiceEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CatalogQueryService);
//# sourceMappingURL=catalog-query.service.js.map