import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ServiceEntity } from '../../../catalog/infrastructure/persistence/service.entity';
import { UserEntity } from '../../../identity/infrastructure/persistence/user.entity';
import { ServiceRequestDocumentEntity } from './service-request-document.entity';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'user_services' })
export class UserServiceEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId!: number;

    @Column({ name: 'service_id', type: 'bigint' })
    serviceId!: number;

    @Column({ name: 'accountant_id', type: 'bigint', nullable: true })
    accountantId!: number | null;

    @Column({
        name: 'application_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    })
    applicationUniqueId!: string | null;

    @Column({ name: 'status', type: 'varchar', length: 255, default: 'draft' })
    status!: string;

    @Column({
        name: 'payment_status',
        type: 'varchar',
        length: 255,
        default: 'pending',
    })
    paymentStatus!: string;

    @Column({ name: 'form_data', type: 'json', nullable: true })
    formData!: Record<string, unknown> | null;

    @Column({ name: 'documents', type: 'json', nullable: true })
    documents!: Record<string, unknown> | null;

    @Column({
        name: 'amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    amount!: string | null;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes!: string | null;

    @Column({ name: 'revision_notes', type: 'text', nullable: true })
    revisionNotes!: string | null;

    @Column({ name: 'ca_notes', type: 'text', nullable: true })
    caNotes!: string | null;

    @Column({ name: 'update_note', type: 'text', nullable: true })
    updateNote!: string | null;

    @Column({ name: 'rejection_reason', type: 'text', nullable: true })
    rejectionReason!: string | null;

    @Column({ name: 'verified', type: 'boolean', default: false })
    verified!: boolean;

    @Column({
        name: 'certificate_url',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    certificateUrl!: string | null;

    @Column({ name: 'submitted_to_ca_at', type: 'timestamp', nullable: true })
    submittedToCaAt!: Date | null;

    @ManyToOne(() => UserEntity, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: UserEntity;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'accountant_id' })
    accountant!: UserEntity | null;

    @ManyToOne(() => ServiceEntity, { nullable: false })
    @JoinColumn({ name: 'service_id' })
    service!: ServiceEntity;

    @OneToMany(
        () => ServiceRequestDocumentEntity,
        (document) => document.userService,
    )
    requestDocuments!: ServiceRequestDocumentEntity[];

    @OneToMany(() => PaymentEntity, (payment) => payment.userService)
    payments!: PaymentEntity[];

    // Transient runtime-only helper populated by application services.
    latestPayment?: PaymentEntity | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
