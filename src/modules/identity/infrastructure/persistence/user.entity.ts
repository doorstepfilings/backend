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

@Entity({ name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    password!: string;

    @Column({ name: 'role', type: 'varchar', length: 255, default: 'user' })
    role!: string;

    @Column({
        name: 'mobile_number',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    mobileNumber!: string | null;

    @Column({ name: 'is_mobile_verified', type: 'boolean', default: false })
    isMobileVerified!: boolean;

    @Column({
        name: 'referral_code',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    referralCode!: string | null;

    @Column({
        name: 'rm_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    rmUniqueId!: string | null;

    @Column({
        name: 'accountant_unique_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    accountantUniqueId!: string | null;

    @Column({ name: 'rm_id', type: 'bigint', nullable: true })
    rmId!: number | null;

    @Column({ name: 'accountant_id', type: 'bigint', nullable: true })
    accountantId!: number | null;

    @Column({ name: 'address', type: 'varchar', length: 255, nullable: true })
    address!: string | null;

    @Column({ name: 'city', type: 'varchar', length: 255, nullable: true })
    city!: string | null;

    @Column({ name: 'state', type: 'varchar', length: 255, nullable: true })
    state!: string | null;

    @Column({ name: 'pincode', type: 'varchar', length: 255, nullable: true })
    pincode!: string | null;

    @ManyToOne(() => UserEntity, (user) => user.assignedUsers, {
        nullable: true,
    })
    @JoinColumn({ name: 'rm_id' })
    regionalManager!: UserEntity | null;

    @OneToMany(() => UserEntity, (user) => user.regionalManager)
    assignedUsers!: UserEntity[];

    @ManyToOne(() => UserEntity, (user) => user.assignedAccountantUsers, {
        nullable: true,
    })
    @JoinColumn({ name: 'accountant_id' })
    accountant!: UserEntity | null;

    @OneToMany(() => UserEntity, (user) => user.accountant)
    assignedAccountantUsers!: UserEntity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
