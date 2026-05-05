import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../identity/infrastructure/persistence/user.entity';
import { UserServiceEntity } from './user-service.entity';

@Entity({ name: 'payments' })
export class PaymentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId!: number;

    @Column({ name: 'user_service_id', type: 'bigint', nullable: true })
    userServiceId!: number | null;

    @Column({
        name: 'payment_provider_order_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    paymentProviderOrderId!: string | null;

    @Column({
        name: 'payment_provider_transaction_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    paymentProviderTransactionId!: string | null;

    @Column({
        name: 'payment_provider',
        type: 'varchar',
        length: 255,
        default: 'razorpay',
    })
    paymentProvider!: string;

    @Column({
        name: 'payment_provider_status',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    paymentProviderStatus!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: 'varchar', length: 10, default: 'INR' })
    currency!: string;

    @Column({ type: 'varchar', length: 50, default: 'pending' })
    status!: string;

    @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'pending' })
    paymentStatus!: string;

    @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
    paymentMethod!: string | null;

    @Column({
        name: 'order_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    })
    orderUniqueId!: string | null;

    @Column({
        name: 'invoice_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    })
    invoiceUniqueId!: string | null;

    @Column({ type: 'json', nullable: true })
    notes!: Record<string, any> | null;

    @Column({ name: 'refund_id', type: 'varchar', length: 255, nullable: true })
    refundId!: string | null;

    @Column({
        name: 'refund_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    refundAmount!: number | null;

    @Column({ name: 'refund_reason', type: 'text', nullable: true })
    refundReason!: string | null;

    @Column({ name: 'refund_status', type: 'varchar', length: 50, nullable: true })
    refundStatus!: string | null;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;

    @ManyToOne(() => UserServiceEntity, { nullable: true })
    @JoinColumn({ name: 'user_service_id' })
    userService!: UserServiceEntity | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
