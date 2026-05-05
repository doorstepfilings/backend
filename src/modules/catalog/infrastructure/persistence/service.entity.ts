import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceCategoryEntity } from './service-category.entity';
import { ServiceDocumentEntity } from './service-document.entity';

@Entity({ name: 'services' })
export class ServiceEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'service_category_id', type: 'bigint' })
    serviceCategoryId!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ name: 'short_description', type: 'text', nullable: true })
    shortDescription!: string | null;

    @Column({ type: 'varchar', length: 255 })
    slug!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    link!: string | null;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ name: 'long_description', type: 'longtext', nullable: true })
    longDescription!: string | null;

    @Column({ type: 'text', nullable: true })
    features!: string | null;

    @Column({ type: 'text', nullable: true })
    requirements!: string | null;

    @Column({ type: 'text', nullable: true })
    process!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price!: string | null;

    @Column({ name: 'pricing_plans', type: 'json', nullable: true })
    pricingPlans!: unknown[] | Record<string, unknown> | null;

    @Column({
        name: 'gst_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        default: 18,
    })
    gstPercentage!: string;

    @Column({
        name: 'service_code',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    serviceCode!: string | null;

    @Column({
        name: 'service_type',
        type: 'varchar',
        length: 255,
        default: 'standard',
    })
    serviceType!: string;

    @Column({ name: 'processing_days', type: 'int', default: 7 })
    processingDays!: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ name: 'is_popular', type: 'boolean', default: false })
    isPopular!: boolean;

    @Column({ name: 'is_featured', type: 'boolean', default: false })
    isFeatured!: boolean;

    @Column({ name: 'metadata', type: 'json', nullable: true })
    metadata!: Record<string, unknown> | null;

    @Column({ name: 'faqs', type: 'json', nullable: true })
    faqs!: unknown[] | Record<string, unknown> | null;

    @Column({ name: 'required_documents_list', type: 'json', nullable: true })
    requiredDocumentsList!: unknown[] | Record<string, unknown> | null;

    @Column({ name: 'extra_documents', type: 'json', nullable: true })
    extraDocuments!: unknown[] | Record<string, unknown> | null;

    @Column({ name: 'admin_notes', type: 'text', nullable: true })
    adminNotes!: string | null;

    @ManyToOne(() => ServiceCategoryEntity, (category) => category.services, {
        nullable: false,
    })
    @JoinColumn({ name: 'service_category_id' })
    category!: ServiceCategoryEntity;

    @OneToMany(() => ServiceDocumentEntity, (document) => document.service)
    documents!: ServiceDocumentEntity[];
}
