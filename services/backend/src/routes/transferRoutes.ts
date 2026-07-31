import { Router } from 'express';
import multer from 'multer';
import { TransferController } from '../controllers/TransferController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per chunk limit
});

const router = Router();

// Support both /api/v1/init and /api/v1/transfers/init
router.post('/init', authMiddleware, TransferController.initTransfer);
router.post('/transfers/init', authMiddleware, TransferController.initTransfer);

router.post('/transfers/:transferId/files/:fileId/chunks/:chunkIndex', upload.single('chunk'), TransferController.uploadChunk);
router.get('/share/:shareCode', TransferController.getShareLink);
router.get('/transfers/:transferId/files/:fileId/chunks/:chunkIndex', TransferController.downloadChunk);

export default router;
