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

@Module({
  controllers: [FileUploadController],
  providers: [
    StorageConfigService,
    FileUploadService,
    StorageProviderFactory,
    FirebaseStorageStrategy,
    {
      provide: STORAGE_PROVIDER,
      inject: [StorageConfigService],
      useFactory: (storageConfigService: StorageConfigService) =>
        storageConfigService.getDefaultProvider(),
    },
    {
      provide: STORAGE_PROVIDER_STRATEGIES,
      inject: [FirebaseStorageStrategy],
      useFactory: (firebaseStorageStrategy: FirebaseStorageStrategy) => [
        firebaseStorageStrategy,
      ],
    },
  ],
})
export class FileUploadModule {}
