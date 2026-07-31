import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authMiddleware, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/stats', authMiddleware, requireAdmin, AdminController.getSystemStats);
router.get('/users', authMiddleware, requireAdmin, AdminController.listUsers);
router.get('/transfers', authMiddleware, requireAdmin, AdminController.listTransfers);

export default router;
