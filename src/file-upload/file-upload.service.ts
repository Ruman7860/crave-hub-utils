import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageProviderFactory } from './factories/storage-provider.factory';
import { UploadFileDto } from './dto/upload-file.dto';
import { UploadedFile } from './interfaces/uploaded-file.interface';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly storageProviderFactory: StorageProviderFactory,
  ) { }

  async uploadFile(file: UploadedFile, payload: UploadFileDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const provider = this.storageProviderFactory.getProvider(payload.provider);

    return provider.upload(file, {
      key: payload.key,
      makePublic: payload.makePublic,
    });
  }

  async getPresignedUrl(key: string, expiresIn = 3600) {
    const provider = this.storageProviderFactory.getProvider('s3');

    if (typeof provider.getPresignedDownloadUrl !== 'function') {
      throw new BadRequestException(
        'The configured storage provider does not support pre-signed URLs',
      );
    }

    const url = await provider.getPresignedDownloadUrl(key, expiresIn);
    return { url };
  }
}
