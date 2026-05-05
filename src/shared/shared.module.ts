import { Global, Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { UniqueIDGenerator } from './utils/unique-id.generator';

@Global()
@Module({
    providers: [PdfService, UniqueIDGenerator],
    exports: [PdfService, UniqueIDGenerator],
})
export class SharedModule {}
