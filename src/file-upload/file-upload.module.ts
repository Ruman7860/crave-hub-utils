import { Module } from '@nestjs/common';
import {
  STORAGE_PROVIDER,
  STORAGE_PROVIDER_STRATEGIES,
} from './constants/storage.constants';
import { StorageConfigService } from './config/storage.config';
import { StorageProviderFactory } from './factories/storage-provider.factory';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';
import { FirebaseStorageStrategy } from './providers/firebase-storage.strategy';
import { S3StorageStrategy } from './providers/s3-storage.strategy';

@Module({
  controllers: [FileUploadController],
  providers: [
    StorageConfigService,
    FileUploadService,
    StorageProviderFactory,
    FirebaseStorageStrategy,
    S3StorageStrategy,
    {
      provide: STORAGE_PROVIDER,
      inject: [StorageConfigService],
      useFactory: (storageConfigService: StorageConfigService) =>
        storageConfigService.getDefaultProvider(),
    },
    {
      provide: STORAGE_PROVIDER_STRATEGIES,
      inject: [FirebaseStorageStrategy, S3StorageStrategy],
      useFactory: (
        firebaseStorageStrategy: FirebaseStorageStrategy,
        s3StorageStrategy: S3StorageStrategy,
      ) => [firebaseStorageStrategy, s3StorageStrategy],
    },
  ],
})
export class FileUploadModule {}
