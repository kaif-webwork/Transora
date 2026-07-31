import dotenv from 'dotenv';
import os from 'os';
dotenv.config();

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'transora_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  localIp,
  
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'transora',
    password: process.env.POSTGRES_PASSWORD || 'transora_secret',
    database: process.env.POSTGRES_DB || 'transora_db',
    connectionString: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  storage: {
    mode: process.env.STORAGE_MODE || 'local',
    localUploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    s3Endpoint: process.env.R2_S3_ENDPOINT,
    s3Region: process.env.AWS_REGION || 'auto',
    s3Bucket: process.env.R2_BUCKET_NAME || 'transora-bucket',
    s3AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },

  chunkSizeBytes: 5 * 1024 * 1024,
  frontendUrl: process.env.FRONTEND_URL || `http://${localIp}:3000`,
};
