import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { pool, isPostgresAvailable } from '../db/index.js';
import { StorageService } from './StorageService.js';
import { RedisService } from './RedisService.js';
import { InitTransferRequest } from '@transora/shared';
import { config } from '../config/index.js';
import bcrypt from 'bcryptjs';

// Ultra-Fast Resilient In-Memory Store
const memoryTransfers = new Map<string, any>();
const memoryFiles = new Map<string, any[]>();
const memoryChunks = new Map<string, any>();

export class TransferService {
  private static generateShareCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  static async initializeTransfer(senderId: string | null, data: InitTransferRequest) {
    if (!data || !Array.isArray(data.files) || data.files.length === 0) {
      throw new Error('Please select at least one valid file to transfer.');
    }

    const shareCode = (data && data.shareCode) ? data.shareCode.toUpperCase() : this.generateShareCode();
    let passwordHash = null;

    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    let expiresAt: Date | null = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (data.expiryType === '1_HOUR') expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    if (data.expiryType === '7_DAYS') expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (data.expiryType === 'NEVER') expiresAt = null;

    const totalSizeBytes = data.files.reduce((acc, f) => acc + (f.fileSizeBytes || 0), 0);
    const totalChunks = data.files.reduce((acc, f) => acc + (f.totalChunks || 1), 0);
    const transferId = crypto.randomUUID();

    const shareUrl = `${config.frontendUrl}/receive/${shareCode}`;

    // Fast DB Check without hanging on PostgreSQL timeouts
    if (isPostgresAvailable) {
      let client;
      try {
        client = await pool.connect();
        await client.query('BEGIN');

        const transferRes = await client.query(
          `INSERT INTO transfers (
            id, sender_id, title, description, share_code, transfer_mode, is_e2ee, 
            encryption_salt, password_hash, max_downloads, total_size_bytes, 
            total_chunks, expiry_type, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            transferId,
            senderId,
            data.title || 'Untitled Transfer',
            data.description || null,
            shareCode,
            data.transferMode || 'CLOUD_CHUNK',
            data.isE2EE || false,
            data.encryptionSalt || null,
            passwordHash,
            data.maxDownloads || null,
            totalSizeBytes,
            totalChunks,
            data.expiryType || '24_HOURS',
            expiresAt,
          ]
        );

        const transfer = transferRes.rows[0];
        const filesCreated = [];

        for (const fileData of data.files) {
          const fileRes = await client.query(
            `INSERT INTO files (transfer_id, file_name, file_path, file_size_bytes, mime_type, sha256_checksum)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
              transfer.id,
              fileData.fileName,
              `/transfers/${transfer.id}/${fileData.fileName}`,
              fileData.fileSizeBytes,
              fileData.mimeType,
              fileData.sha256Checksum || 'fast_checksum',
            ]
          );
          filesCreated.push(fileRes.rows[0]);
        }

        await client.query('COMMIT');

        return {
          transferId: transfer.id,
          shareCode: transfer.share_code,
          shareUrl,
          files: filesCreated,
        };
      } catch (err) {
        if (client) {
          try { await client.query('ROLLBACK'); } catch (e) {}
        }
        console.warn('[TransferService] Transaction failed, falling back to 1ms memory store.');
      } finally {
        if (client) {
          try { client.release(); } catch (e) {}
        }
      }
    }

    // 1ms Ultra-Fast In-Memory Implementation
    const filesCreated = data.files.map((fileData) => ({
      id: crypto.randomUUID(),
      transfer_id: transferId,
      file_name: fileData.fileName,
      file_path: `/transfers/${transferId}/${fileData.fileName}`,
      file_size_bytes: fileData.fileSizeBytes,
      mime_type: fileData.mimeType,
      sha256_checksum: fileData.sha256Checksum || 'fast_checksum',
    }));

    const transfer = {
      id: transferId,
      sender_id: senderId,
      title: data.title || 'Untitled Transfer',
      description: data.description || null,
      share_code: shareCode,
      transfer_mode: data.transferMode || 'CLOUD_CHUNK',
      status: 'INITIALIZED',
      is_e2ee: data.isE2EE || false,
      encryption_salt: data.encryptionSalt || null,
      password_hash: passwordHash,
      max_downloads: data.maxDownloads || null,
      download_count: 0,
      total_size_bytes: totalSizeBytes,
      total_chunks: totalChunks,
      uploaded_chunks: 0,
      expiry_type: data.expiryType || '24_HOURS',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      files: filesCreated,
    };

    memoryTransfers.set(transferId, transfer);
    memoryTransfers.set(shareCode, transfer);
    memoryFiles.set(transferId, filesCreated);

    return {
      transferId: transfer.id,
      shareCode: transfer.share_code,
      shareUrl,
      files: filesCreated,
    };
  }

  static async uploadChunk(
    transferId: string,
    fileId: string,
    chunkIndex: number,
    sha256Checksum: string,
    buffer: Buffer
  ) {
    const storageKey = await StorageService.saveChunk(transferId, fileId, chunkIndex, buffer);

    memoryChunks.set(`${fileId}:${chunkIndex}`, storageKey);
    memoryChunks.set(`${transferId}:${fileId}:${chunkIndex}`, storageKey);

    if (isPostgresAvailable) {
      try {
        await pool.query(
          `INSERT INTO file_chunks (file_id, chunk_index, chunk_size_bytes, sha256_checksum, storage_key, is_uploaded, uploaded_at)
           VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP)
           ON CONFLICT (file_id, chunk_index) 
           DO UPDATE SET is_uploaded = TRUE, uploaded_at = CURRENT_TIMESTAMP`,
          [fileId, chunkIndex, buffer.length, sha256Checksum || 'fast_checksum', storageKey]
        );
      } catch (err) {}
    }

    const uploadedChunks = await RedisService.trackChunkProgress(transferId, chunkIndex);

    const transfer = memoryTransfers.get(transferId);
    if (transfer) {
      transfer.uploaded_chunks += 1;
      transfer.status = 'UPLOADING';
    }

    return { success: true, uploadedChunks, storageKey };
  }

  static async getShareLink(shareCode: string, password?: string) {
    let transfer = null;
    let files: any[] = [];

    if (isPostgresAvailable) {
      try {
        const transferRes = await pool.query(`SELECT * FROM transfers WHERE share_code = $1`, [shareCode]);
        if (transferRes.rows.length > 0) {
          transfer = transferRes.rows[0];
          const filesRes = await pool.query(`SELECT * FROM files WHERE transfer_id = $1`, [transfer.id]);
          files = filesRes.rows;
        }
      } catch (err) {
        transfer = memoryTransfers.get(shareCode);
        if (transfer) {
          files = memoryFiles.get(transfer.id) || [];
        }
      }
    } else {
      transfer = memoryTransfers.get(shareCode);
      if (transfer) {
        files = memoryFiles.get(transfer.id) || [];
      }
    }

    if (!transfer) {
      throw new Error('Transfer link not found or expired');
    }

    if (transfer.expires_at && new Date(transfer.expires_at) < new Date()) {
      throw new Error('Transfer link has expired');
    }

    if (transfer.password_hash) {
      if (!password) {
        return { requiresPassword: true, shareCode: transfer.share_code };
      }
      const isValid = await bcrypt.compare(password, transfer.password_hash);
      if (!isValid) {
        throw new Error('Incorrect password');
      }
    }

    return {
      requiresPassword: false,
      transfer: {
        ...transfer,
        files,
      },
    };
  }

  static async getTransferByShareCode(shareCode: string, password?: string) {
    return this.getShareLink(shareCode, password);
  }

  static async getChunkStream(transferId: string, fileId: string, chunkIndex: number) {
    let storageKey = memoryChunks.get(`${fileId}:${chunkIndex}`) || memoryChunks.get(`${transferId}:${fileId}:${chunkIndex}`);

    if (!storageKey && isPostgresAvailable) {
      try {
        const chunkRes = await pool.query(
          `SELECT storage_key FROM file_chunks WHERE file_id = $1 AND chunk_index = $2 AND is_uploaded = TRUE`,
          [fileId, chunkIndex]
        );
        if (chunkRes.rows.length > 0) {
          storageKey = chunkRes.rows[0].storage_key;
        }
      } catch (err) {}
    }

    if (!storageKey) {
      const dir = path.join(config.storage.localUploadDir, transferId, fileId);
      storageKey = path.join(dir, `chunk_${chunkIndex}.bin`);
    }

    // Active Polling Loop: wait up to 10 seconds for real-time streaming chunks
    let attempts = 20;
    while (!fs.existsSync(storageKey) && attempts > 0) {
      await new Promise((r) => setTimeout(r, 500));
      attempts--;
    }

    return StorageService.getChunkStream(storageKey);
  }

  static async downloadFile(transferId: string, fileId: string, res: any) {
    let file: any = null;
    const filesList = memoryFiles.get(transferId) || [];
    file = filesList.find((f: any) => f.id === fileId);

    if (!file && isPostgresAvailable) {
      try {
        const fileRes = await pool.query(`SELECT * FROM files WHERE id = $1`, [fileId]);
        if (fileRes.rows.length > 0) {
          file = fileRes.rows[0];
        }
      } catch (err) {}
    }

    const fileName = file ? (file.file_name || file.fileName || 'downloaded_file') : 'downloaded_file';
    const fileSizeBytes = file ? (file.file_size_bytes || file.fileSizeBytes || 0) : 0;
    const mimeType = file ? (file.mime_type || file.mimeType || 'application/octet-stream') : 'application/octet-stream';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', mimeType);
    if (fileSizeBytes > 0) {
      res.setHeader('Content-Length', fileSizeBytes.toString());
    }

    const chunkSize = fileSizeBytes > 0 ? (
      fileSizeBytes < 50 * 1024 * 1024 ? 4 * 1024 * 1024 :
      fileSizeBytes < 500 * 1024 * 1024 ? 8 * 1024 * 1024 : 16 * 1024 * 1024
    ) : 4 * 1024 * 1024;

    const totalChunks = fileSizeBytes > 0 ? Math.max(1, Math.ceil(fileSizeBytes / chunkSize)) : 1;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      let storageKey = memoryChunks.get(`${fileId}:${chunkIndex}`) || memoryChunks.get(`${transferId}:${fileId}:${chunkIndex}`);

      if (!storageKey) {
        const dir = path.join(config.storage.localUploadDir, transferId, fileId);
        storageKey = path.join(dir, `chunk_${chunkIndex}.bin`);
      }

      let attempts = 20;
      while (!fs.existsSync(storageKey) && attempts > 0) {
        await new Promise((r) => setTimeout(r, 500));
        attempts--;
      }

      if (fs.existsSync(storageKey)) {
        const chunkStream = fs.createReadStream(storageKey, { highWaterMark: 1024 * 1024 });
        await new Promise((resolve) => {
          chunkStream.pipe(res, { end: false });
          chunkStream.on('end', () => resolve(true));
          chunkStream.on('error', () => resolve(false));
        });
      }
    }

    res.end();
  }
}
