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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const service_entity_1 = require("../../catalog/infrastructure/persistence/service.entity");
const user_entity_1 = require("../../identity/infrastructure/persistence/user.entity");
const enquiry_entity_1 = require("../../customer/infrastructure/persistence/enquiry.entity");
const operations_mapper_1 = require("./operations.mapper");
const user_service_entity_1 = require("../infrastructure/persistence/user-service.entity");
let CartService = class CartService {
    userServicesRepository;
    servicesRepository;
    usersRepository;
    enquiriesRepository;
    constructor(userServicesRepository, servicesRepository, usersRepository, enquiriesRepository) {
        this.userServicesRepository = userServicesRepository;
        this.servicesRepository = servicesRepository;
        this.usersRepository = usersRepository;
        this.enquiriesRepository = enquiriesRepository;
    }
    async addToCart(userId, addToCartDto) {
        const existing = await this.userServicesRepository.findOne({
            where: {
                serviceId: addToCartDto.service_id,
                status: 'in_cart',
                userId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Service already in cart');
        }
        const service = await this.servicesRepository.findOne({
            where: {
                id: addToCartDto.service_id,
            },
            relations: {
                category: true,
                documents: true,
            },
        });
        if (!service) {
            throw new common_1.NotFoundException('Service not found');
        }
        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        let amount = service.price;
        if (addToCartDto.pricing_plan && Array.isArray(service.pricingPlans)) {
            const plan = service.pricingPlans.find((item) => item.name === addToCartDto.pricing_plan);
            if (plan?.price !== undefined && plan.price !== null) {
                amount = String(plan.price);
            }
        }
        const userService = await this.userServicesRepository.save(this.userServicesRepository.create({
            serviceId: service.id,
            status: 'in_cart',
            userId,
            formData: addToCartDto.form_data,
            amount,
        }));
        await this.enquiriesRepository.save(this.enquiriesRepository.create({
            email: user.email,
            message: 'User added service to cart',
            name: user.name,
            phone: user.mobileNumber,
            service: service.name,
            status: 'pending',
        }));
        const hydrated = await this.userServicesRepository.findOneOrFail({
            where: {
                id: userService.id,
            },
            relations: {
                service: {
                    category: true,
                    documents: true,
                },
            },
        });
        return (0, operations_mapper_1.toUserServiceResource)(hydrated);
    }
    async getCart(userId) {
        const items = await this.userServicesRepository.find({
            where: {
                status: 'in_cart',
                userId,
            },
            relations: {
                service: {
                    category: true,
                    documents: true,
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });
        return items.map((item) => (0, operations_mapper_1.toUserServiceResource)(item));
    }
    async removeFromCart(userId, id) {
        const userService = await this.userServicesRepository.findOne({
            where: {
                id,
                status: 'in_cart',
                userId,
            },
        });
        if (!userService) {
            throw new common_1.NotFoundException('Cart item not found');
        }
        await this.userServicesRepository.delete({
            id: userService.id,
        });
        return null;
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_service_entity_1.UserServiceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.ServiceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(enquiry_entity_1.EnquiryEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map