import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { ListMediaQueryDto } from './dto/list-media-query.dto';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './types/media-asset.types';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(`File type "${file.mimetype}" is not allowed`),
        false,
      );
    }
  },
};

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /api/media/upload?folder=catalog
   * Upload a single file. Form field name: "file"
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadOne(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Use form field "file"');
    }
    return this.mediaService.uploadOne(file, folder);
  }

  /**
   * POST /api/media/upload/bulk?folder=documents
   * Upload up to 20 files. Form field name: "files"
   */
  @Post('upload/bulk')
  @UseInterceptors(FilesInterceptor('files', 20, multerOptions))
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'general',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'No files uploaded. Use form field "files"',
      );
    }
    return this.mediaService.uploadMany(files, folder);
  }

  /**
   * GET /api/media?folder=catalog&page=1&limit=20
   * List all media assets with optional folder filter and pagination
   */
  @Get()
  findAll(@Query() query: ListMediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  /**
   * GET /api/media/:id
   * Get a single media asset by ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.findById(id);
  }

  /**
   * DELETE /api/media/:id
   * Delete a media asset (removes file from disk + DB record)
   */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.deleteById(id);
  }
}
