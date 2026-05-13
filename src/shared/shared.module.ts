import { Global, Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { UniqueIDGenerator } from './utils/unique-id.generator';
import { PrismaModule } from './services/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [PdfService, UniqueIDGenerator],
    exports: [PdfService, UniqueIDGenerator, PrismaModule],
})
export class SharedModule {}
