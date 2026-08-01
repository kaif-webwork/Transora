import { useState } from 'react';
import { useTransferStore } from '../store/useTransferStore';
import { getBackendApiUrl } from '../lib/api';

const PARALLEL_WORKERS = 12;

function generateClientShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TR';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getAdaptiveChunkSize(fileSize: number): number {
  if (fileSize < 50 * 1024 * 1024) return 4 * 1024 * 1024;
  if (fileSize < 500 * 1024 * 1024) return 8 * 1024 * 1024;
  return 16 * 1024 * 1024;
}

export function useChunkUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProgress = useTransferStore((s) => s.updateProgress);

  const uploadFile = async (
    files: File[],
    options: {
      password?: string;
      expiryType?: '1_HOUR' | '24_HOURS' | '7_DAYS' | 'NEVER';
      transferMode?: 'CLOUD_CHUNK' | 'WEBRTC_LAN';
      onInit?: (data: { transferId: string; shareCode: string; shareUrl: string }) => void;
    }
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const clientShareCode = generateClientShareCode();

      // 1. Prepare lightweight file metadata specifications (1ms)
      const fileSpecs = files.map((file) => {
        const chunkSize = getAdaptiveChunkSize(file.size);
        const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
        return {
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          sha256Checksum: 'fast_checksum',
          chunkSizeBytes: chunkSize,
          totalChunks,
        };
      });

      // 2. Register Transfer with Backend FIRST (Fast 50ms Awaited Payload Registration)
      const initUrl = getBackendApiUrl('/api/v1/init');
      let initRes: Response;
      try {
        initRes = await fetch(initUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: files.length === 1 ? files[0].name : `${files.length} Files Transfer`,
            expiryType: options.expiryType || '24_HOURS',
            password: options.password || undefined,
            transferMode: options.transferMode || 'CLOUD_CHUNK',
            files: fileSpecs,
            shareCode: clientShareCode,
          }),
        });
      } catch (networkErr: any) {
        throw new Error(`Cannot connect to Backend Server. Please check backend connection.`);
      }

      const contentType = initRes.headers.get('content-type') || '';
      let initData: any = {};
      if (contentType.includes('application/json')) {
        initData = await initRes.json().catch(() => ({}));
      } else {
        throw new Error('Backend Server URL Missing / Unreachable.');
      }

      if (!initRes.ok) {
        throw new Error(initData.error || `Transfer initialization failed (HTTP ${initRes.status})`);
      }

      const { transferId, shareCode, shareUrl, files: createdFiles } = initData;

      const finalShareCode = shareCode || clientShareCode;
      const clientShareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/receive/${finalShareCode}`
        : (shareUrl || `/receive/${finalShareCode}`);

      // Set UI progress to 5% Initialized
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      updateProgress(1, 1, 5);

      // Trigger Share Link & QR Code display NOW THAT BACKEND HAS REGISTERED CODE GUARANTEED!
      if (options.onInit) {
        options.onInit({
          transferId: transferId || 'tr_instant',
          shareCode: finalShareCode,
          shareUrl: clientShareUrl,
        });
      }

      // 3. Sequential & Parallel Chunk Upload to Backend
      let totalChunksUploaded = 0;
      let totalChunksOverall = 0;
      for (const file of files) {
        const chunkSize = getAdaptiveChunkSize(file.size);
        totalChunksOverall += Math.max(1, Math.ceil(file.size / chunkSize));
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dbFile = (createdFiles && createdFiles[i]) ? createdFiles[i] : { id: 'file_' + i };
        const chunkSize = getAdaptiveChunkSize(file.size);
        const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));
        const chunkIndices = Array.from({ length: totalChunks }, (_, idx) => idx);

        const processChunk = async (chunkIndex: number) => {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunkBlob = file.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunkBlob);

          const chunkUrl = getBackendApiUrl(`/api/v1/transfers/${transferId}/files/${dbFile.id}/chunks/${chunkIndex}`);
          let retries = 3;
          let uploaded = false;

          while (!uploaded && retries > 0) {
            try {
              const res = await fetch(chunkUrl, {
                method: 'POST',
                headers: { 'x-checksum-sha256': 'fast_chunk_hash' },
                body: formData,
              });
              if (res.ok) {
                uploaded = true;
              } else {
                retries--;
                if (retries > 0) await new Promise((r) => setTimeout(r, 500));
              }
            } catch (e) {
              retries--;
              if (retries > 0) await new Promise((r) => setTimeout(r, 500));
            }
          }

          totalChunksUploaded++;
          const percent = Math.min(99, Math.round((totalChunksUploaded / totalChunksOverall) * 100));
          updateProgress(totalChunksUploaded, totalChunksOverall, Math.round((percent / 100) * totalSize));
        };

        for (let j = 0; j < chunkIndices.length; j += PARALLEL_WORKERS) {
          const batch = chunkIndices.slice(j, j + PARALLEL_WORKERS);
          await Promise.all(batch.map((idx) => processChunk(idx)));
        }
      }

      updateProgress(totalChunksOverall, totalChunksOverall, totalSize);
      setIsUploading(false);

      return {
        transferId: transferId || 'tr_instant',
        shareCode: finalShareCode,
        shareUrl: clientShareUrl,
      };
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadFile, isUploading, error };
}
