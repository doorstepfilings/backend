import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import { PaymentService } from '../../application/payment.service';
import { successResponse } from '../../../../shared/http/api-response';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserOrdersController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('orders')
  async getMyOrders(@CurrentAuthUser() user: { userId: number }) {
    const orders = await this.paymentService.myOrders(user.userId);
    return successResponse(orders);
  }
}
