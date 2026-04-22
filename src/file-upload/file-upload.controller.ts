import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileUploadService } from './file-upload.service';
import { UploadedFile as UploadedFileModel } from './interfaces/uploaded-file.interface';

@Controller('api/files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: UploadedFileModel,
    @Body() payload: UploadFileDto,
  ) {
    return this.fileUploadService.uploadFile(file, payload);
  }
}
