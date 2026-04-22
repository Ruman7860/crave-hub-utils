import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageProviderFactory } from './factories/storage-provider.factory';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadedFile } from './interfaces/uploaded-file.interface';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly storageProviderFactory: StorageProviderFactory,
  ) {}

  async uploadFile(file: UploadedFile, payload: UploadFileDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const provider = this.storageProviderFactory.getProvider(payload.provider);

    return provider.upload(file, {
      folder: payload.folder,
      fileName: payload.fileName,
      makePublic: payload.makePublic,
    });
  }
}
