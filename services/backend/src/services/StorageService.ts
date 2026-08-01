import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/index.js';

export class StorageService {
  private static s3: S3Client | null = config.storage.mode === 's3' && config.storage.s3Endpoint
    ? new S3Client({
        region: config.storage.s3Region,
        endpoint: config.storage.s3Endpoint,
        credentials: {
          accessKeyId: config.storage.s3AccessKeyId,
          secretAccessKey: config.storage.s3SecretAccessKey,
        },
      })
    : null;

  static async saveChunk(transferId: string, fileId: string, chunkIndex: number, buffer: Buffer): Promise<string> {
    const key = `transfers/${transferId}/${fileId}/chunk_${chunkIndex}.bin`;

    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: config.storage.s3Bucket,
          Key: key,
          Body: buffer,
        })
      );
      return key;
    }

    // Ultra-Fast Async Local Disk Writes
    const dir = path.join(config.storage.localUploadDir, transferId, fileId);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    const filePath = path.join(dir, `chunk_${chunkIndex}.bin`);
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  static async getChunkStream(storageKey: string): Promise<fs.ReadStream | NodeJS.ReadableStream> {
    if (this.s3) {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: config.storage.s3Bucket,
          Key: storageKey,
        })
      );
      return response.Body as NodeJS.ReadableStream;
    }

    const resolvedPath = path.resolve(storageKey);
    if (fs.existsSync(resolvedPath)) {
      return fs.createReadStream(resolvedPath, { highWaterMark: 1024 * 1024 });
    }
    if (fs.existsSync(storageKey)) {
      return fs.createReadStream(storageKey, { highWaterMark: 1024 * 1024 });
    }

    throw new Error(`Chunk file not found at ${storageKey}`);
  }

  static async getPresignedDownloadUrl(storageKey: string): Promise<string> {
    if (this.s3) {
      const command = new GetObjectCommand({
        Bucket: config.storage.s3Bucket,
        Key: storageKey,
      });
      return getSignedUrl(this.s3, command, { expiresIn: 3600 });
    }
    return `/api/v1/transfers/chunks/download?key=${encodeURIComponent(storageKey)}`;
  }
}
