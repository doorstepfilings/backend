import { Module } from '@nestjs/common';
import { CatalogQueryService } from './application/catalog-query.service';
import { CatalogController } from './presentation/http/catalog.controller';

@Module({
    imports: [],
    controllers: [CatalogController],
    providers: [CatalogQueryService],
    exports: [CatalogQueryService],
})
export class CatalogModule {}
