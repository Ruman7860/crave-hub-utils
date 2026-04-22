import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProviderName } from '../constants/storage.constants';

interface FirebaseCredentialConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

@Injectable()
export class StorageConfigService {
  constructor(private readonly configService: ConfigService) {}

  getDefaultProvider(): StorageProviderName {
    const provider = this.configService.get<string>('FILE_STORAGE_PROVIDER');

    if (!provider) {
      return StorageProviderName.FIREBASE;
    }

    return provider.toLowerCase() as StorageProviderName;
  }

  getFirebaseBucket(): string {
    const bucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

    if (!bucket) {
      throw new InternalServerErrorException(
        'FIREBASE_STORAGE_BUCKET is not configured',
      );
    }

    return bucket;
  }

  getFirebaseCredentials(): FirebaseCredentialConfig {
    const serviceAccountJson =
      this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

    if (serviceAccountJson) {
      const parsedCredentials = JSON.parse(serviceAccountJson) as Partial<{
        project_id: string;
        client_email: string;
        private_key: string;
      }>;

      if (
        !parsedCredentials.project_id ||
        !parsedCredentials.client_email ||
        !parsedCredentials.private_key
      ) {
        throw new InternalServerErrorException(
          'FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email and private_key',
        );
      }

      return {
        projectId: parsedCredentials.project_id,
        clientEmail: parsedCredentials.client_email,
        privateKey: parsedCredentials.private_key.replace(/\\n/g, '\n'),
      };
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      throw new InternalServerErrorException(
        'Firebase credentials are not configured. Provide FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY',
      );
    }

    return {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }
}
