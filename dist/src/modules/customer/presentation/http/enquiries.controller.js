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
exports.EnquiriesController = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../../../../shared/http/api-response");
const customer_enquiries_service_1 = require("../../application/customer-enquiries.service");
const create_enquiry_dto_1 = require("./dto/create-enquiry.dto");
let EnquiriesController = class EnquiriesController {
    customerEnquiriesService;
    constructor(customerEnquiriesService) {
        this.customerEnquiriesService = customerEnquiriesService;
    }
    async createEnquiry(data) {
        const enquiry = await this.customerEnquiriesService.createEnquiry(data);
        return (0, api_response_1.successResponse)(enquiry, 'Thank you for your enquiry. We will get back to you soon!');
    }
    async createCustomerEnquiry(data) {
        return this.createEnquiry(data);
    }
};
exports.EnquiriesController = EnquiriesController;
__decorate([
    (0, common_1.Post)('enquiries'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_enquiry_dto_1.CreateEnquiryDto]),
    __metadata("design:returntype", Promise)
], EnquiriesController.prototype, "createEnquiry", null);
__decorate([
    (0, common_1.Post)('customer/enquiries'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_enquiry_dto_1.CreateEnquiryDto]),
    __metadata("design:returntype", Promise)
], EnquiriesController.prototype, "createCustomerEnquiry", null);
exports.EnquiriesController = EnquiriesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [customer_enquiries_service_1.CustomerEnquiriesService])
], EnquiriesController);
//# sourceMappingURL=enquiries.controller.js.map