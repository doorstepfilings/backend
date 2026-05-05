import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../../catalog/infrastructure/persistence/service.entity';
import { UserEntity } from '../../identity/infrastructure/persistence/user.entity';
import { EnquiryEntity } from '../../customer/infrastructure/persistence/enquiry.entity';
import { toUserServiceResource } from './operations.mapper';
import { UserServiceEntity } from '../infrastructure/persistence/user-service.entity';
import { AddToCartDto } from '../presentation/http/dto/add-to-cart.dto';

type PricingPlan = {
    name?: string;
    price?: number | string;
};

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(UserServiceEntity)
        private readonly userServicesRepository: Repository<UserServiceEntity>,
        @InjectRepository(ServiceEntity)
        private readonly servicesRepository: Repository<ServiceEntity>,
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @InjectRepository(EnquiryEntity)
        private readonly enquiriesRepository: Repository<EnquiryEntity>,
    ) {}

    async addToCart(userId: number, addToCartDto: AddToCartDto) {
        const existing = await this.userServicesRepository.findOne({
            where: {
                serviceId: addToCartDto.service_id,
                status: 'in_cart',
                userId,
            },
        });

        if (existing) {
            throw new ConflictException('Service already in cart');
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
            throw new NotFoundException('Service not found');
        }

        const user = await this.usersRepository.findOne({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        let amount = service.price;
        if (addToCartDto.pricing_plan && Array.isArray(service.pricingPlans)) {
            const plan = (service.pricingPlans as PricingPlan[]).find(
                (item) => item.name === addToCartDto.pricing_plan,
            );
            if (plan?.price !== undefined && plan.price !== null) {
                amount = String(plan.price);
            }
        }

        const userService = await this.userServicesRepository.save(
            this.userServicesRepository.create({
                serviceId: service.id,
                status: 'in_cart',
                userId,
                formData: addToCartDto.form_data,
                amount,
            }),
        );

        await this.enquiriesRepository.save(
            this.enquiriesRepository.create({
                email: user.email,
                message: 'User added service to cart',
                name: user.name,
                phone: user.mobileNumber,
                service: service.name,
                status: 'pending',
            }),
        );

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

        return toUserServiceResource(hydrated);
    }

    async getCart(userId: number) {
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

        return items.map((item) => toUserServiceResource(item));
    }

    async removeFromCart(userId: number, id: number) {
        const userService = await this.userServicesRepository.findOne({
            where: {
                id,
                status: 'in_cart',
                userId,
            },
        });

        if (!userService) {
            throw new NotFoundException('Cart item not found');
        }

        await this.userServicesRepository.delete({
            id: userService.id,
        });

        return null;
    }
}
