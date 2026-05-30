import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/services/prisma.service';
import { toServiceCategoryListItem, toServiceResource } from './catalog.mapper';

@Injectable()
export class CatalogQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      include: {
        services: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map(toServiceCategoryListItem);
  }

  async getServiceBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: {
        slug,
      },
      include: {
        category: true,
        documents: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return toServiceResource(service);
  }
}
