import { Redis } from 'ioredis';
import { config } from '../config/index.js';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop reconnecting if redis is down locally
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.warn('[Redis] Connection warning (using memory fallback if Redis unavailable):', err.message);
  });
} catch (err) {
  console.warn('[Redis] Client initialization skipped.');
}

const memoryStore = new Map<string, string>();

export class RedisService {
  static async get(key: string): Promise<string | null> {
    if (redisClient && redisClient.status === 'ready') {
      return redisClient.get(key);
    }
    return memoryStore.get(key) || null;
  }

  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, value);
      } else {
        await redisClient.set(key, value);
      }
      return;
    }
    memoryStore.set(key, value);
  }

  static async del(key: string): Promise<void> {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(key);
      return;
    }
    memoryStore.delete(key);
  }

  static async incr(key: string): Promise<number> {
    if (redisClient && redisClient.status === 'ready') {
      return redisClient.incr(key);
    }
    const current = parseInt(memoryStore.get(key) || '0', 10);
    const next = current + 1;
    memoryStore.set(key, next.toString());
    return next;
  }

  static async trackChunkProgress(transferId: string, chunkIndex: number): Promise<number> {
    const key = `transfer:${transferId}:uploaded_chunks`;
    return this.incr(key);
  }
}
