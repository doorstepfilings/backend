import { PaymentService } from '../../application/payment.service';
export declare class UserOrdersController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    getMyOrders(user: {
        userId: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            amount: number;
            created_at: Date;
            currency: string;
            gst_amount: number;
            id: number;
            invoice_unique_id: string | null;
            items: {
                application_unique_id: string | null;
                id: number;
                name: string;
                price: number;
                service_id: number;
                status: string;
            }[];
            order_unique_id: string | null;
            payment_provider: string;
            payment_provider_order_id: string | null;
            payment_provider_transaction_id: string | null;
            payment_status: string;
            status: string;
            subtotal: number;
        }[];
    }>;
}
