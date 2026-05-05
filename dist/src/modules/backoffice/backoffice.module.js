"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackofficeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../identity/infrastructure/persistence/user.entity");
const service_entity_1 = require("../catalog/infrastructure/persistence/service.entity");
const service_category_entity_1 = require("../catalog/infrastructure/persistence/service-category.entity");
const enquiry_entity_1 = require("../customer/infrastructure/persistence/enquiry.entity");
const admin_controller_1 = require("./presentation/http/admin.controller");
const admin_service_1 = require("./application/admin.service");
const operations_module_1 = require("../operations/operations.module");
const rm_controller_1 = require("./presentation/http/rm.controller");
const rm_service_1 = require("./application/rm.service");
const accountant_controller_1 = require("./presentation/http/accountant.controller");
const accountant_service_1 = require("./application/accountant.service");
const user_service_entity_1 = require("../operations/infrastructure/persistence/user-service.entity");
const service_request_document_entity_1 = require("../operations/infrastructure/persistence/service-request-document.entity");
let BackofficeModule = class BackofficeModule {
};
exports.BackofficeModule = BackofficeModule;
exports.BackofficeModule = BackofficeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.UserEntity,
                service_entity_1.ServiceEntity,
                service_category_entity_1.ServiceCategoryEntity,
                enquiry_entity_1.EnquiryEntity,
                user_service_entity_1.UserServiceEntity,
                service_request_document_entity_1.ServiceRequestDocumentEntity,
            ]),
            operations_module_1.OperationsModule,
        ],
        controllers: [admin_controller_1.AdminController, rm_controller_1.RMController, accountant_controller_1.AccountantController],
        providers: [admin_service_1.AdminService, rm_service_1.RMService, accountant_service_1.AccountantService],
    })
], BackofficeModule);
//# sourceMappingURL=backoffice.module.js.map