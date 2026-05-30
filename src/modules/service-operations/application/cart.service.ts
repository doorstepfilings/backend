import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toUserServiceResource } from './operations.mapper';
import { AddToCartDto } from '../presentation/http/dto/add-to-cart.dto';

type PricingPlan = {
  name?: string;
  price?: number | string;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const service = await this.prisma.service.findUnique({
      where: {
        id: addToCartDto.service_id,
      },
      include: {
        category: true,
        documents: true,
        serviceWorkflows: {
          include: {
            stage: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const user = await this.prisma.user.findUnique({
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
        amount = String(plan.price) as any;
      }
    }

    const userService = await this.prisma.userService.create({
      data: {
        serviceId: service.id,
        status: 'in_cart',
        userId,
        formData: addToCartDto.form_data as any,
        amount,
      },
    });

    await this.prisma.enquiry.create({
      data: {
        email: user.email,
        message: 'User added service to cart',
        name: user.name,
        phone: user.mobileNumber,
        service: service.name,
        status: 'pending',
      },
    });

    const hydrated = await this.prisma.userService.findUniqueOrThrow({
      where: {
        id: userService.id,
      },
      include: {
        service: {
          include: {
            category: true,
            documents: true,
            serviceWorkflows: {
              include: {
                stage: true,
              },
            },
          },
        },
      },
    });

    return toUserServiceResource(hydrated, {
      includeHiddenStages: false,
      includeInternalDocuments: false,
      includeInternalNotes: false,
      ownerUserId: userId,
    });
  }

  async getCart(userId: number) {
    const items = await this.prisma.userService.findMany({
      where: {
        status: 'in_cart',
        userId,
      },
      include: {
        service: {
          include: {
            category: true,
            documents: true,
            serviceWorkflows: {
              include: {
                stage: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items.map((item) =>
      toUserServiceResource(item, {
        includeHiddenStages: false,
        includeInternalDocuments: false,
        includeInternalNotes: false,
        ownerUserId: userId,
      }),
    );
  }

  async removeFromCart(userId: number, id: number) {
    const userService = await this.prisma.userService.findFirst({
      where: {
        id,
        status: 'in_cart',
        userId,
      },
    });

    if (!userService) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.userService.delete({
      where: { id: userService.id },
    });

    return null;
  }
}
