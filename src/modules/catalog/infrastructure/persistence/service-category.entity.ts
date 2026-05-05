import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceEntity } from './service.entity';

@Entity({ name: 'service_categories' })
export class ServiceCategoryEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    slug!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    icon!: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder!: number;

    @OneToMany(() => ServiceEntity, (service) => service.category)
    services!: ServiceEntity[];
}
