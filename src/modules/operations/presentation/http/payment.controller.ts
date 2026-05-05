import { Controller, Post, Body, UseGuards, Param, ParseIntPipe, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { CurrentAuthUser } from '../../../identity/presentation/http/current-auth-user.decorator';
import {
    PaymentService,
    type VerifyPaymentPayload,
} from '../../application/payment.service';
import { successResponse } from '../../../../shared/http/api-response';
import { Roles } from '../../../identity/infrastructure/auth/roles.decorator';
import { RolesGuard } from '../../../identity/infrastructure/auth/roles.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('razorpay/create-order')
    async createOrder(@Body('user_service_id') userServiceId: number) {
        const order = await this.paymentService.createOrder(userServiceId);
        return successResponse(order);
    }

    @Post('razorpay/order-single')
    async createLegacySingleOrder(
        @Body('user_service_id') userServiceId: number,
    ) {
        const order = await this.paymentService.createOrder(userServiceId);
        return successResponse(order);
    }

    @Post('razorpay/create-cart-order')
    async createCartOrder(@CurrentAuthUser() user: { userId: number }) {
        const order = await this.paymentService.createCartOrder(user.userId);
        return successResponse(order);
    }

    @Post('razorpay/order')
    async createLegacyCartOrder(@CurrentAuthUser() user: { userId: number }) {
        const order = await this.paymentService.createCartOrder(user.userId);
        return successResponse(order);
    }

    @Post('razorpay/verify')
    async verifyPayment(@Body() payload: VerifyPaymentPayload) {
        const result = await this.paymentService.verifyPayment(payload);
        return successResponse(result);
    }

    /**
     * Admin-only: Process a refund for a payment record.
     * POST /payments/:id/refund
     */
    @Post(':id/refund')
    @UseGuards(RolesGuard)
    @Roles('super_admin', 'admin')
    async processRefund(
        @Param('id', ParseIntPipe) id: number,
        @Body('reason') reason?: string,
    ) {
        const result = await this.paymentService.processRefund(id, reason);
        return successResponse(result, 'Refund processed successfully');
    }

    @Get('my-orders/:id/invoice')
    async downloadInvoice(
        @CurrentAuthUser() user: { userId: number },
        @Param('id', ParseIntPipe) id: number,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.paymentService.downloadInvoice(user.userId, id);
        
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice_${id}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    }
}
