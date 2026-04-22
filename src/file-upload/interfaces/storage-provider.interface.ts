import { StorageProviderName } from '../constants/storage.constants';
import { UploadedFile } from './uploaded-file.interface';

export interface UploadFileOptions {
  folder?: string;
  fileName?: string;
  makePublic?: boolean;
}

export interface UploadFileResult {
  provider: StorageProviderName | string;
  bucket: string;
  path: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

export interface StorageProviderStrategy {
  readonly providerName: StorageProviderName | string;
  upload(file: UploadedFile, options?: UploadFileOptions): Promise<UploadFileResult>;
}
