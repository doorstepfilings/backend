import {
  BadRequestException,
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { successResponse } from '../../../../shared/http/api-response';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { UserServicesService } from '../../application/user-services.service';
import { UpdateStageDto } from './dto/update-stage.dto';

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
  async updateStatus() {
    throw new BadRequestException(
      'Lifecycle status is now derived from workflow stage. Use the workflow stage update endpoint instead.',
    );
  }

  @Patch('service-requests/:id/stage')
  async updateStage(
    @CurrentAuthUser() authUser: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: UpdateStageDto,
  ) {
    const result = await this.userServicesService.updateAccountantRequestStage(
      authUser.userId,
      id,
      data,
    );
    return successResponse(result);
  }
}
