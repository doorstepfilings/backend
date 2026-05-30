import { Module } from '@nestjs/common';
import { EnquiriesService } from './application/enquiries.service';
import { EnquiriesController } from './presentation/http/enquiries.controller';

@Module({
  imports: [],
  controllers: [EnquiriesController],
  providers: [EnquiriesService],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
