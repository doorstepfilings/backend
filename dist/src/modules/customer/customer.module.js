"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const customer_enquiries_service_1 = require("./application/customer-enquiries.service");
const enquiry_entity_1 = require("./infrastructure/persistence/enquiry.entity");
const enquiries_controller_1 = require("./presentation/http/enquiries.controller");
let CustomerModule = class CustomerModule {
};
exports.CustomerModule = CustomerModule;
exports.CustomerModule = CustomerModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([enquiry_entity_1.EnquiryEntity])],
        controllers: [enquiries_controller_1.EnquiriesController],
        providers: [customer_enquiries_service_1.CustomerEnquiriesService],
        exports: [customer_enquiries_service_1.CustomerEnquiriesService],
    })
], CustomerModule);
//# sourceMappingURL=customer.module.js.map