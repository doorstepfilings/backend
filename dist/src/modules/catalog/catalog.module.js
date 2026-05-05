"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const catalog_query_service_1 = require("./application/catalog-query.service");
const service_category_entity_1 = require("./infrastructure/persistence/service-category.entity");
const service_document_entity_1 = require("./infrastructure/persistence/service-document.entity");
const service_entity_1 = require("./infrastructure/persistence/service.entity");
const catalog_controller_1 = require("./presentation/http/catalog.controller");
let CatalogModule = class CatalogModule {
};
exports.CatalogModule = CatalogModule;
exports.CatalogModule = CatalogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                service_category_entity_1.ServiceCategoryEntity,
                service_entity_1.ServiceEntity,
                service_document_entity_1.ServiceDocumentEntity,
            ]),
        ],
        controllers: [catalog_controller_1.CatalogController],
        providers: [catalog_query_service_1.CatalogQueryService],
        exports: [catalog_query_service_1.CatalogQueryService],
    })
], CatalogModule);
//# sourceMappingURL=catalog.module.js.map