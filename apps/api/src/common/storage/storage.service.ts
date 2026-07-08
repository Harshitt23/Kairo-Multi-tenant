import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../../config/env';

const PRESIGN_TTL_SECONDS = 300; // 5 minutes to start the upload/download

/**
 * Thin wrapper over the S3 API. Uploads never pass through the API process:
 * the client requests a presigned PUT URL, uploads the bytes directly to S3
 * (MinIO locally), then confirms so we persist a row. Downloads are served via
 * short-lived presigned GET URLs so the bucket can stay private.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET', { infer: true });
    this.client = new S3Client({
      region: config.get('S3_REGION', { infer: true }),
      endpoint: config.get('S3_ENDPOINT', { infer: true }),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE', { infer: true }),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', { infer: true }),
        secretAccessKey: config.get('S3_SECRET_KEY', { infer: true }),
      },
    });
  }

  /** Namespaced object key: tenant-isolated and collision-free. */
  buildKey(organizationId: string, issueId: string, fileName: string): string {
    const safe = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 120);
    return `org/${organizationId}/issues/${issueId}/${randomUUID()}-${safe}`;
  }

  presignUpload(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
  }

  presignDownload(key: string, fileName?: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ...(fileName
          ? { ResponseContentDisposition: `attachment; filename="${fileName}"` }
          : {}),
      }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      // A missing object shouldn't block deleting the DB row.
      this.logger.warn(`Failed to delete S3 object ${key}: ${(err as Error).message}`);
    }
  }
}
