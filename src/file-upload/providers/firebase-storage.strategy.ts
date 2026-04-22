import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  StorageProviderStrategy,
  UploadFileOptions,
  UploadFileResult,
} from '../interfaces/storage-provider.interface';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { StorageProviderName } from '../constants/storage.constants';
import { StorageConfigService } from '../config/storage.config';

type FirebaseAdminModule = {
  apps: Array<{ name: string }>;
  credential: {
    cert(credentials: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
    }): unknown;
  };
  initializeApp(config: {
    credential: unknown;
    storageBucket: string;
  }, name?: string): unknown;
  app(name?: string): unknown;
};

type FirebaseStorageFile = {
  save(
    data: Buffer,
    options: {
      metadata: { contentType: string };
      resumable: boolean;
      public?: boolean;
    },
  ): Promise<void>;
  makePublic(): Promise<void>;
};

type FirebaseBucket = {
  name: string;
  file(path: string): FirebaseStorageFile;
};

type FirebaseStorage = {
  bucket(bucketName?: string): FirebaseBucket;
};

type FirebaseApp = {
  storage(): FirebaseStorage;
};

@Injectable()
export class FirebaseStorageStrategy implements StorageProviderStrategy {
  readonly providerName = StorageProviderName.FIREBASE;
  private readonly logger = new Logger(FirebaseStorageStrategy.name);
  private appInstance?: FirebaseApp;

  constructor(private readonly storageConfigService: StorageConfigService) {}

  async upload(
    file: UploadedFile,
    options: UploadFileOptions = {},
  ): Promise<UploadFileResult> {
    const bucketName = this.storageConfigService.getFirebaseBucket();
    const bucket = this.getApp().storage().bucket(bucketName);
    const fileName = this.buildFileName(file.originalname, options.fileName);
    const filePath = this.buildFilePath(fileName, options.folder);
    const storageFile = bucket.file(filePath);

    try {
      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false,
      });

      if (options.makePublic) {
        await storageFile.makePublic();
      }
    } catch (error) {
      this.logger.error('Failed to upload file to Firebase Storage', error);
      throw new InternalServerErrorException(
        'Failed to upload file to storage provider',
      );
    }

    return {
      provider: this.providerName,
      bucket: bucket.name,
      path: filePath,
      fileName,
      contentType: file.mimetype,
      size: file.size,
      url: options.makePublic
        ? `https://storage.googleapis.com/${bucket.name}/${filePath}`
        : `gs://${bucket.name}/${filePath}`,
    };
  }

  private getApp(): FirebaseApp {
    if (this.appInstance) {
      return this.appInstance;
    }

    const firebaseAdmin =
      this.loadFirebaseAdminModule() as FirebaseAdminModule;
    const credentials = this.storageConfigService.getFirebaseCredentials();
    const bucketName = this.storageConfigService.getFirebaseBucket();
    const appName = `crave-hub-utils-${this.providerName}`;
    const existingApp = firebaseAdmin.apps.find((app) => app.name === appName);

    this.appInstance = (existingApp
      ? firebaseAdmin.app(appName)
      : firebaseAdmin.initializeApp(
          {
            credential: firebaseAdmin.credential.cert(credentials),
            storageBucket: bucketName,
          },
          appName,
        )) as FirebaseApp;

    return this.appInstance;
  }

  private loadFirebaseAdminModule(): unknown {
    try {
      return require('firebase-admin');
    } catch {
      throw new InternalServerErrorException(
        'firebase-admin package is required to use Firebase storage',
      );
    }
  }

  private buildFileName(originalName: string, requestedFileName?: string) {
    const extension = this.extractExtension(originalName);
    const baseName = this.sanitizeValue(
      requestedFileName ?? originalName.replace(/\.[^/.]+$/, ''),
    );
    const timestamp = Date.now();

    return extension
      ? `${baseName}-${timestamp}.${extension}`
      : `${baseName}-${timestamp}`;
  }

  private buildFilePath(fileName: string, folder?: string) {
    if (!folder) {
      return fileName;
    }

    const normalizedFolder = folder
      .split('/')
      .map((part) => this.sanitizeValue(part))
      .filter(Boolean)
      .join('/');

    return normalizedFolder ? `${normalizedFolder}/${fileName}` : fileName;
  }

  private extractExtension(fileName: string) {
    const match = fileName.match(/\.([^.]+)$/);
    return match?.[1]?.toLowerCase() ?? '';
  }

  private sanitizeValue(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_./]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-/.]+|[-/.]+$/g, '');
  }
}
