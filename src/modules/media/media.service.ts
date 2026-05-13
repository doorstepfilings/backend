import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/services/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import type { AppEnvironment } from '../../config/environment';
import {
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    MediaFolder,
} from './types/media-asset.types';
import type { ListMediaQueryDto } from './dto/list-media-query.dto';

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);
    private readonly uploadRoot: string;
    private readonly appUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {
        this.uploadRoot = path.resolve(process.cwd(), 'public', 'storage');
        const env = this.config.get<AppEnvironment>('app');
        this.appUrl = env?.appUrl ?? 'http://localhost:4000';

        // Ensure base media directory exists
        const mediaRoot = path.join(this.uploadRoot, 'media');
        if (!fs.existsSync(mediaRoot)) {
            fs.mkdirSync(mediaRoot, { recursive: true });
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Upload
    // ─────────────────────────────────────────────────────────────

    async uploadOne(
        file: Express.Multer.File,
        folder: MediaFolder | string = 'general',
        uploadedById?: number,
    ) {
        this.validateFile(file);

        const { filePath, filename } = this.saveToDisk(file, folder);
        const url = this.buildPublicUrl(filePath);
        const ext = path.extname(file.originalname).replace('.', '') || null;

        const asset = await this.prisma.mediaAsset.create({
            data: {
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                fileSize: BigInt(file.size),
                extension: ext,
                filePath,
                url,
                folder,
                uploadedById: uploadedById ?? null,
            },
        });

        this.logger.log(`Uploaded media asset #${asset.id}: ${filePath}`);
        return this.serialize(asset);
    }

    async uploadMany(
        files: Express.Multer.File[],
        folder: MediaFolder | string = 'general',
        uploadedById?: number,
    ) {
        return Promise.all(files.map((f) => this.uploadOne(f, folder, uploadedById)));
    }

    // ─────────────────────────────────────────────────────────────
    //  Query
    // ─────────────────────────────────────────────────────────────

    async findAll(query: ListMediaQueryDto) {
        const { folder, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.mediaAsset.findMany({
                where: folder ? { folder } : undefined,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.mediaAsset.count({
                where: folder ? { folder } : undefined,
            }),
        ]);

        return {
            data: data.map((a) => this.serialize(a)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: number) {
        const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (!asset) throw new NotFoundException(`Media asset #${id} not found`);
        return this.serialize(asset);
    }

    // ─────────────────────────────────────────────────────────────
    //  Delete
    // ─────────────────────────────────────────────────────────────

    async deleteById(id: number) {
        const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
        if (!asset) throw new NotFoundException(`Media asset #${id} not found`);

        // Remove file from disk
        const fullPath = path.join(this.uploadRoot, ...asset.filePath.split('/'));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            this.logger.log(`Deleted file: ${fullPath}`);
        }

        await this.prisma.mediaAsset.delete({ where: { id } });
        return { success: true, id };
    }

    // ─────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────

    buildPublicUrl(filePath: string): string {
        // filePath is relative like: media/catalog/1234_file.pdf
        return `${this.appUrl}/storage/${filePath}`;
    }

    private saveToDisk(
        file: Express.Multer.File,
        folder: string,
    ): { filePath: string; filename: string } {
        const dir = path.join(this.uploadRoot, 'media', folder);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const ext = path.extname(file.originalname);
        const basename = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_\-]/g, '_')
            .substring(0, 60);
        const filename = `${Date.now()}_${basename}${ext}`;
        const fullPath = path.join(dir, filename);

        fs.writeFileSync(fullPath, file.buffer);

        // Use forward slashes for consistent URL building
        const filePath = `media/${folder}/${filename}`;
        return { filePath, filename };
    }

    private validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(
                `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
            );
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `File type "${file.mimetype}" is not allowed`,
            );
        }
    }

    private serialize(asset: any) {
        return {
            ...asset,
            fileSize: asset.fileSize?.toString(),
        };
    }
}
