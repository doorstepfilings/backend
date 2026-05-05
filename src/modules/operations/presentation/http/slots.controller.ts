import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { SlotsService } from '../../application/slots.service';

@Controller('service/slot-availability')
@UseGuards(JwtAuthGuard)
export class SlotsController {
    constructor(private readonly slotsService: SlotsService) {}

    @Get()
    async getAvailability(
        @Query('service_id') serviceId: number,
        @Query('date') date: string,
    ) {
        const availability = await this.slotsService.getAvailability(
            Number(serviceId),
            date,
        );

        return successResponse(availability);
    }
}
