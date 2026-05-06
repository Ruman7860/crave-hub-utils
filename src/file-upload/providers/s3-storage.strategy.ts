import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  StorageProviderStrategy,
  UploadFileOptions,
  UploadFileResult,
} from '../interfaces/storage-provider.interface';
import { UploadedFile } from '../interfaces/uploaded-file.interface';
import { StorageProviderName } from '../constants/storage.constants';
import { StorageConfigService } from '../config/storage.config';

@Injectable()
export class S3StorageStrategy implements StorageProviderStrategy {
  readonly providerName = StorageProviderName.S3;
  private readonly logger = new Logger(S3StorageStrategy.name);
  private clientInstance?: S3Client;
  private bucketName?: string;

  constructor(private readonly storageConfigService: StorageConfigService) {}

  async upload(
    file: UploadedFile,
    options: UploadFileOptions = {},
  ): Promise<UploadFileResult> {
    const client = this.getClient();
    const bucket = this.bucketName!;
    const filePath = this.buildKey(file.originalname, options);

    // Files are stored privately — access is granted via pre-signed URLs only.
    const input: PutObjectCommandInput = {
      Bucket: bucket,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    };

    try {
      await client.send(new PutObjectCommand(input));
    } catch (error) {
      this.logger.error('Failed to upload file to S3', error);
      throw new InternalServerErrorException(
        'Failed to upload file to storage provider',
      );
    }

    return {
      provider: this.providerName,
      bucket,
      path: filePath,
      fileName: filePath.split('/').pop()!,
      contentType: file.mimetype,
      size: file.size,
      // Return the internal S3 URI — callers resolve to a presigned URL via getPresignedDownloadUrl()
      url: `s3://${bucket}/${filePath}`,
    };
  }

  /**
   * Generates a pre-signed download URL for a private S3 object.
   *
   * @param key  The S3 object key or full s3://bucket/key URI.
   * @param expiresIn  Expiry in seconds. Defaults to 3600 (1 hour).
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const client = this.getClient();
    const bucket = this.bucketName!;
    const objectKey = this.extractKey(key, bucket);

    const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });

    try {
      return await getSignedUrl(client, command, { expiresIn });
    } catch (error) {
      this.logger.error('Failed to generate pre-signed URL', error);
      throw new InternalServerErrorException(
        'Failed to generate pre-signed download URL',
      );
    }
  }

  // ─── Key building ───────────────────────────────────────────────────────────

  /**
   * Builds the S3 object key.
   *
   * When `userId` + `restaurantId` are supplied the structured path is used:
   *   `{userId}/restaurants/{restaurantId}/images/{imageId}.{ext}`
   *
   * Otherwise falls back to the legacy `{folder}/{fileName}-{timestamp}.{ext}` path.
   */
  private buildKey(originalName: string, options: UploadFileOptions): string {
    return options.key ?? originalName;
  }

  // ─── Client ─────────────────────────────────────────────────────────────────

  private getClient(): S3Client {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const config = this.storageConfigService.getS3Config();
    this.bucketName = config.bucket;

    this.clientInstance = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint
        ? { endpoint: config.endpoint, forcePathStyle: true }
        : {}),
    });

    return this.clientInstance;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Accepts a bare key or full s3://bucket/key URI and returns just the key.
   */
  private extractKey(input: string, bucket: string): string {
    if (input.startsWith('s3://')) {
      const withoutScheme = input.slice(5);
      const slash = withoutScheme.indexOf('/');
      return slash === -1 ? withoutScheme : withoutScheme.slice(slash + 1);
    }
    const prefix = `${bucket}/`;
    return input.startsWith(prefix) ? input.slice(prefix.length) : input;
  }

  private extractExtension(fileName: string): string {
    return fileName.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? '';
  }

  private sanitizeValue(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_.]+|[-_.]+$/g, '');
  }
}
