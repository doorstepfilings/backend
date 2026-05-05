import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { UserServicesService } from '../../application/user-services.service';

@Controller('accountant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('accountant')
export class AccountantController {
    constructor(private readonly userServicesService: UserServicesService) {}

    @Get('service-requests')
    async getServiceRequests(@CurrentAuthUser() authUser: { userId: number }) {
        const services = await this.userServicesService.getAccountantServices(
            authUser.userId,
        );
        return successResponse(services);
    }

    @Patch('service-requests/:id/status')
    async updateStatus(
        @Param('id') id: number,
        @Body() data: { status: string; ca_notes?: string },
    ) {
        const result = await this.userServicesService.updateApplicationStatus(
            id,
            data,
        );
        return successResponse(result);
    }
}
