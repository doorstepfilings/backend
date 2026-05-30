import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { RMService } from '../../application/rm.service';
import { successResponse } from '../../../../shared/http/api-response';

@Controller('rm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('regional_manager')
export class RMController {
  constructor(private readonly rmService: RMService) {}

  @Get('assigned-users')
  async getAssignedUsers(@Req() req: any) {
    const result = await this.rmService.getAssignedUsers(req.user.id);
    return successResponse(result);
  }

  @Get('accountants')
  async getAccountants() {
    const result = await this.rmService.getAccountants();
    return successResponse(result);
  }

  @Post('assign-accountant')
  async assignAccountant(
    @Req() req: any,
    @Body() data: { user_id: number; accountant_id: number | null },
  ) {
    const result = await this.rmService.assignAccountant(
      req.user.id,
      data.user_id,
      data.accountant_id,
    );
    return successResponse(result, 'Accountant assigned successfully');
  }

  @Get('service-requests')
  async getAssignedUserServices(@Req() req: any) {
    const result = await this.rmService.getAssignedUserServices(req.user.id);
    return successResponse(result);
  }
}
