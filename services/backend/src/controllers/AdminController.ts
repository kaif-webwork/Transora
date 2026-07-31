import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { pool } from '../db/index.js';

export class AdminController {
  static async getSystemStats(req: AuthenticatedRequest, res: Response) {
    try {
      const usersCount = await pool.query('SELECT COUNT(*) FROM users');
      const transfersCount = await pool.query('SELECT COUNT(*) FROM transfers');
      const activeTransfersCount = await pool.query("SELECT COUNT(*) FROM transfers WHERE status = 'UPLOADING'");
      const totalStorage = await pool.query('SELECT COALESCE(SUM(total_size_bytes), 0) as total FROM transfers');

      return res.json({
        totalUsers: parseInt(usersCount.rows[0].count, 10),
        totalTransfers: parseInt(transfersCount.rows[0].count, 10),
        activeTransfers: parseInt(activeTransfersCount.rows[0].count, 10),
        totalStorageBytes: parseInt(totalStorage.rows[0].total, 10),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await pool.query('SELECT id, email, full_name, role, is_verified, storage_used_bytes, created_at FROM users ORDER BY created_at DESC LIMIT 50');
      return res.json({ users: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async listTransfers(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await pool.query('SELECT * FROM transfers ORDER BY created_at DESC LIMIT 50');
      return res.json({ transfers: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
