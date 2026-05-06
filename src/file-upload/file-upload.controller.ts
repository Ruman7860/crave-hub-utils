import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { PresignUrlDto } from './dto/presign-url.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileUploadService } from './file-upload.service';
import { UploadedFile as UploadedFileModel } from './interfaces/uploaded-file.interface';

@Controller('api/files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) { }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: UploadedFileModel,
    @Body() payload: UploadFileDto,
  ) {
    return this.fileUploadService.uploadFile(file, payload);
  }

  /**
   * Generates a short-lived pre-signed download URL for a private S3 object.
   * Pass the full s3://bucket/key URI or just the object key.
   *
   * GET /api/files/presign?key=restaurants%2Fmyfile.jpg&expiresIn=3600
   */
  @UseGuards(JwtAuthGuard)
  @Get('presign')
  getPresignedUrl(@Query() query: PresignUrlDto) {
    return this.fileUploadService.getPresignedUrl(query.key, query.expiresIn);
  }
}
