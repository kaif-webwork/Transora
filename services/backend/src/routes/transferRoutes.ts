import { Router } from 'express';
import multer from 'multer';
import { TransferController } from '../controllers/TransferController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per chunk limit for ultra-fast large file uploads
});

const router = Router();

// Support both /api/v1/init and /api/v1/transfers/init
router.post('/init', authMiddleware, TransferController.initTransfer);
router.post('/transfers/init', authMiddleware, TransferController.initTransfer);

router.post('/transfers/:transferId/files/:fileId/chunks/:chunkIndex', upload.single('chunk'), TransferController.uploadChunk);
router.get('/share/:shareCode', TransferController.getShareLink);
router.get('/transfers/:transferId/files/:fileId/chunks/:chunkIndex', TransferController.downloadChunk);
router.get('/transfers/:transferId/files/:fileId/download', TransferController.downloadFile);

export default router;
