import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { TransferService } from '../services/TransferService.js';
import { io } from '../server.js';

export class TransferController {
  static async initTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const senderId = req.user ? req.user.userId : null;
      const result = await TransferService.initializeTransfer(senderId, req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      console.error('[TransferController.initTransfer Error]', err);
      return res.status(400).json({ error: err.message || 'Failed to initialize transfer' });
    }
  }

  static async uploadChunk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { transferId, fileId, chunkIndex } = req.params;
      const sha256Checksum = (req.headers['x-checksum-sha256'] as string) || '';

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No chunk file payload received' });
      }

      const index = parseInt(chunkIndex, 10);
      const result = await TransferService.uploadChunk(
        transferId,
        fileId,
        index,
        sha256Checksum,
        req.file.buffer
      );

      if (io) {
        io.to(transferId).emit('chunk:progress', {
          transferId,
          fileId,
          chunkIndex: index,
          totalUploadedChunks: result.uploadedChunks,
          speedBps: req.file.buffer.length,
        });

        io.to(transferId).emit('chunk:available', {
          transferId,
          fileId,
          chunkIndex: index,
        });
      }

      return res.json(result);
    } catch (err: any) {
      console.error('[TransferController.uploadChunk Error]', err);
      return res.status(400).json({ error: err.message || 'Chunk upload failed' });
    }
  }

  static async getShareLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { shareCode } = req.params;
      const password = req.query.password as string | undefined;

      const result = await TransferService.getTransferByShareCode(shareCode, password);
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Share link resolution failed' });
    }
  }

  static async downloadChunk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { transferId, fileId, chunkIndex } = req.params;
      const stream = await TransferService.getChunkStream(transferId, fileId, parseInt(chunkIndex, 10));
      
      res.setHeader('Content-Type', 'application/octet-stream');
      stream.pipe(res);
    } catch (err: any) {
      return res.status(404).json({ error: err.message || 'Chunk download failed' });
    }
  }
}
