import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'otp_verifications' })
export class OtpVerificationEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    identifier!: string; // Email or Mobile

    @Column({ type: 'varchar', length: 10 })
    otp!: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt!: Date;

    @Column({ type: 'boolean', default: false })
    verified!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
