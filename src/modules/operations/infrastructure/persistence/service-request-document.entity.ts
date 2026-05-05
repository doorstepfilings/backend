import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserServiceEntity } from './user-service.entity';
import { UserEntity } from '../../../identity/infrastructure/persistence/user.entity';

@Entity({ name: 'service_request_documents' })
export class ServiceRequestDocumentEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_service_id', type: 'bigint' })
    userServiceId!: number;

    @Column({ name: 'service_document_id', type: 'bigint', nullable: true })
    serviceDocumentId!: number | null;

    @Column({ name: 'uploaded_by', type: 'bigint' })
    uploadedById!: number;

    @Column({ name: 'source_document_id', type: 'bigint', nullable: true })
    sourceDocumentId!: number | null;

    @Column({
        name: 'document_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    documentName!: string | null;

    @Column({
        name: 'document_type',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    documentType!: string | null;

    @Column({
        name: 'document_category',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    documentCategory!: string | null;

    @Column({ name: 'file_name', type: 'varchar', length: 255 })
    fileName!: string;

    @Column({ name: 'file_path', type: 'varchar', length: 255 })
    filePath!: string;

    @Column({
        name: 'file_extension',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    fileExtension!: string | null;

    @Column({ name: 'file_size', type: 'bigint', nullable: true })
    fileSize!: number;

    @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
    mimeType!: string;

    @Column({ name: 'version', type: 'int', default: 1 })
    version!: number;

    @Column({ name: 'status', type: 'varchar', length: 50, default: 'pending' })
    status!: string;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes!: string | null;

    @Column({ name: 'is_final', type: 'boolean', default: false })
    isFinal!: boolean;

    @ManyToOne(() => UserServiceEntity, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_service_id' })
    userService!: UserServiceEntity;

    @ManyToOne(() => UserEntity, { nullable: false })
    @JoinColumn({ name: 'uploaded_by' })
    uploadedBy!: UserEntity;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    get fileUrl(): string {
        return `/storage/${this.filePath}`;
    }
}
