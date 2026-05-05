import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { UserServicesService } from '../../application/user-services.service';

@Controller('rm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('rm')
export class RMController {
    constructor(private readonly userServicesService: UserServicesService) {}

    @Get('service-requests')
    async getServiceRequests(@CurrentAuthUser() authUser: { userId: number }) {
        const services = await this.userServicesService.getRmServices(
            authUser.userId,
        );
        return successResponse(services);
    }

    @Post('assign-accountant')
    async assignAccountant(
        @Body() data: { userServiceId: number; accountantId: number },
    ) {
        const result = await this.userServicesService.assignAccountantToService(
            data.userServiceId,
            data.accountantId,
        );
        return successResponse(result);
    }
}
