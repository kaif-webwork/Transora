import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { config } from '../config/index.js';
import { UserRole } from '@transora/shared';
import crypto from 'crypto';

const memoryUsers = new Map<string, any>();

export class AuthService {
  static async registerUser(email: string, passwordHash: string, fullName: string) {
    let dbConnected = false;
    try {
      const client = await pool.connect();
      client.release();
      dbConnected = true;
    } catch (e) {
      dbConnected = false;
    }

    if (dbConnected) {
      try {
        const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (existing.rows.length > 0) {
          throw new Error('Email address already registered');
        }

        const res = await pool.query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, full_name, role, storage_quota_bytes, storage_used_bytes, created_at`,
          [email, passwordHash, fullName, 'USER']
        );
        const user = res.rows[0];
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );
        return { user, token };
      } catch (err: any) {
        if (err.message === 'Email address already registered') throw err;
      }
    }

    // In-Memory Fallback User Store
    if (memoryUsers.has(email)) {
      throw new Error('Email address already registered');
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'USER' as UserRole,
      storage_quota_bytes: 100 * 1024 * 1024 * 1024,
      storage_used_bytes: 0,
      created_at: new Date().toISOString(),
    };
    memoryUsers.set(email, user);
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return { user, token };
  }

  static async loginUser(email: string, passwordHash: string) {
    let user: any = null;

    try {
      const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
      if (res.rows.length > 0) {
        user = res.rows[0];
      }
    } catch (err) {
      user = memoryUsers.get(email);
    }

    if (!user) {
      user = memoryUsers.get(email);
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(passwordHash, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        storage_quota_bytes: user.storage_quota_bytes,
        storage_used_bytes: user.storage_used_bytes,
        created_at: user.created_at,
      },
      token,
    };
  }
}
