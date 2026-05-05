import { UserEntity } from '../../../identity/infrastructure/persistence/user.entity';
import { UserServiceEntity } from './user-service.entity';
export declare class PaymentEntity {
    id: number;
    userId: number;
    userServiceId: number | null;
    paymentProviderOrderId: string | null;
    paymentProviderTransactionId: string | null;
    paymentProvider: string;
    paymentProviderStatus: string | null;
    amount: number;
    currency: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    orderUniqueId: string | null;
    invoiceUniqueId: string | null;
    notes: Record<string, any> | null;
    refundId: string | null;
    refundAmount: number | null;
    refundReason: string | null;
    refundStatus: string | null;
    user: UserEntity;
    userService: UserServiceEntity | null;
    createdAt: Date;
    updatedAt: Date;
}
