import { Pool } from 'pg';
import { config } from '../config/index.js';

export const pool = new Pool(
  config.postgres.connectionString
    ? { connectionString: config.postgres.connectionString }
    : {
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: config.postgres.database,
        max: 5,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 1000,
      }
);

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning] Database offline or connection lost:', err.message);
});

export async function initDatabase() {
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('GUEST', 'USER', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE transfer_status AS ENUM ('INITIALIZED', 'UPLOADING', 'READY', 'DOWNLOADING', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE transfer_mode AS ENUM ('CLOUD_CHUNK', 'WEBRTC_LAN', 'DIRECT_P2P');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE link_expiry_type AS ENUM ('1_HOUR', '24_HOURS', '7_DAYS', 'NEVER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        full_name VARCHAR(100),
        avatar_url TEXT,
        role user_role DEFAULT 'USER',
        google_id VARCHAR(255) UNIQUE,
        github_id VARCHAR(255) UNIQUE,
        is_verified BOOLEAN DEFAULT FALSE,
        storage_quota_bytes BIGINT DEFAULT 107374182400,
        storage_used_bytes BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        share_code VARCHAR(32) UNIQUE NOT NULL,
        transfer_mode transfer_mode DEFAULT 'CLOUD_CHUNK',
        status transfer_status DEFAULT 'INITIALIZED',
        is_e2ee BOOLEAN DEFAULT FALSE,
        encryption_salt VARCHAR(255),
        password_hash VARCHAR(255),
        max_downloads INT DEFAULT NULL,
        download_count INT DEFAULT 0,
        total_size_bytes BIGINT NOT NULL,
        total_chunks INT NOT NULL,
        uploaded_chunks INT DEFAULT 0,
        expiry_type link_expiry_type DEFAULT '24_HOURS',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        mime_type VARCHAR(127) NOT NULL,
        sha256_checksum VARCHAR(64) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS file_chunks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        chunk_index INT NOT NULL,
        chunk_size_bytes INT NOT NULL,
        sha256_checksum VARCHAR(64) NOT NULL,
        storage_key TEXT NOT NULL,
        is_uploaded BOOLEAN DEFAULT FALSE,
        uploaded_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_file_chunk UNIQUE (file_id, chunk_index)
      );

      CREATE INDEX IF NOT EXISTS idx_transfers_share_code ON transfers(share_code);
      CREATE INDEX IF NOT EXISTS idx_transfers_sender_id ON transfers(sender_id);
      CREATE INDEX IF NOT EXISTS idx_files_transfer_id ON files(transfer_id);
      CREATE INDEX IF NOT EXISTS idx_file_chunks_file_index ON file_chunks(file_id, chunk_index);
    `);
    console.log('[Database] PostgreSQL schema initialized successfully.');
  } catch (err: any) {
    console.warn('[Database] PostgreSQL offline, using resilient in-memory mode:', err.message);
  } finally {
    if (client) {
      try { client.release(); } catch (e) {}
    }
  }
}
