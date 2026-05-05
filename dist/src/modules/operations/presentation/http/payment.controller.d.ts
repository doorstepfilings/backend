import type { Response } from 'express';
import { PaymentService, type VerifyPaymentPayload } from '../../application/payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createOrder(userServiceId: number): Promise<{
        success: boolean;
        message: string;
        data: {
            amount: number;
            amount_paise: number;
            base_amount: number;
            gst_amount: number;
            grand_total: number;
            invoice_unique_id: string | null;
            is_cart: boolean;
            order_unique_id: string | null;
            razorpay_order_id: string;
            currency: string;
            key_id: string | undefined;
            payment_id: number;
            service_ids: string[];
        };
    }>;
    createLegacySingleOrder(userServiceId: number): Promise<{
        success: boolean;
        message: string;
        data: {
            amount: number;
            amount_paise: number;
            base_amount: number;
            gst_amount: number;
            grand_total: number;
            invoice_unique_id: string | null;
            is_cart: boolean;
            order_unique_id: string | null;
            razorpay_order_id: string;
            currency: string;
            key_id: string | undefined;
            payment_id: number;
            service_ids: string[];
        };
    }>;
    createCartOrder(user: {
        userId: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            amount: number;
            amount_paise: number;
            base_amount: number;
            gst_amount: number;
            grand_total: number;
            invoice_unique_id: string | null;
            is_cart: boolean;
            order_unique_id: string | null;
            razorpay_order_id: string;
            currency: string;
            key_id: string | undefined;
            payment_id: number;
            service_ids: string[];
        };
    }>;
    createLegacyCartOrder(user: {
        userId: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            amount: number;
            amount_paise: number;
            base_amount: number;
            gst_amount: number;
            grand_total: number;
            invoice_unique_id: string | null;
            is_cart: boolean;
            order_unique_id: string | null;
            razorpay_order_id: string;
            currency: string;
            key_id: string | undefined;
            payment_id: number;
            service_ids: string[];
        };
    }>;
    verifyPayment(payload: VerifyPaymentPayload): Promise<{
        success: boolean;
        message: string;
        data: {
            invoice_unique_id: string | null;
            order_unique_id: string | null;
            payment_id: number;
            service_ids: string[];
            success: boolean;
        };
    }>;
    processRefund(id: number, reason?: string): Promise<{
        success: boolean;
        message: string;
        data: import("../../infrastructure/persistence/payment.entity").PaymentEntity;
    }>;
    downloadInvoice(user: {
        userId: number;
    }, id: number, res: Response): Promise<void>;
}
