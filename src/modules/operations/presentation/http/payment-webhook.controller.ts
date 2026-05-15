import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from '../../application/payment.service';

@Controller('payments/razorpay')
export class PaymentWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentService.handleWebhookEvent(
      body,
      signature,
      request.rawBody?.toString('utf8'),
    );
  }
}
