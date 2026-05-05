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
exports.CustomerEnquiriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_mapper_1 = require("./customer.mapper");
const enquiry_entity_1 = require("../infrastructure/persistence/enquiry.entity");
let CustomerEnquiriesService = class CustomerEnquiriesService {
    enquiriesRepository;
    constructor(enquiriesRepository) {
        this.enquiriesRepository = enquiriesRepository;
    }
    async createEnquiry(data) {
        const enquiry = await this.enquiriesRepository.save(this.enquiriesRepository.create({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone?.trim() || null,
            service: data.service?.trim() || null,
            message: data.message.trim(),
            status: 'pending',
        }));
        return (0, customer_mapper_1.toEnquiryResource)(enquiry);
    }
};
exports.CustomerEnquiriesService = CustomerEnquiriesService;
exports.CustomerEnquiriesService = CustomerEnquiriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(enquiry_entity_1.EnquiryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomerEnquiriesService);
//# sourceMappingURL=customer-enquiries.service.js.map