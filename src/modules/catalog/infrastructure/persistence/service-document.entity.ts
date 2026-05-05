import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'service_documents' })
export class ServiceDocumentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'service_id', type: 'bigint' })
    serviceId!: number;

    @Column({
        name: 'document_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    documentName!: string | null;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
    name!: string | null;

    @Column({ name: 'slug', type: 'varchar', length: 255, nullable: true })
    slug!: string | null;

    @Column({ name: 'description', type: 'text', nullable: true })
    description!: string | null;

    @Column({
        name: 'document_type',
        type: 'varchar',
        length: 255,
        default: 'required',
    })
    documentType!: string;

    @Column({ name: 'file_type', type: 'varchar', length: 255, default: 'pdf' })
    fileType!: string;

    @Column({ name: 'max_size', type: 'int', default: 5 })
    maxSize!: number;

    @Column({ name: 'is_required', type: 'boolean', default: true })
    isRequired!: boolean;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder!: number;

    @Column({ name: 'metadata', type: 'json', nullable: true })
    metadata!: Record<string, unknown> | null;

    @ManyToOne(() => ServiceEntity, (service) => service.documents, {
        nullable: false,
    })
    @JoinColumn({ name: 'service_id' })
    service!: ServiceEntity;
}
