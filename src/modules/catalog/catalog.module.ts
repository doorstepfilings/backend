import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogQueryService } from './application/catalog-query.service';
import { ServiceCategoryEntity } from './infrastructure/persistence/service-category.entity';
import { ServiceDocumentEntity } from './infrastructure/persistence/service-document.entity';
import { ServiceEntity } from './infrastructure/persistence/service.entity';
import { CatalogController } from './presentation/http/catalog.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ServiceCategoryEntity,
            ServiceEntity,
            ServiceDocumentEntity,
        ]),
    ],
    controllers: [CatalogController],
    providers: [CatalogQueryService],
    exports: [CatalogQueryService],
})
export class CatalogModule {}
