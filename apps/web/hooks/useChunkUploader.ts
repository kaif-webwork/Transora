import { useState } from 'react';
import { useTransferStore } from '../store/useTransferStore';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const PARALLEL_WORKERS = 6; // 6 Parallel Multi-Lane Workers for Ultra-Fast Speed

async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'chunk_' + Math.random().toString(36).substring(2, 10);
  }
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
    }
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. Prepare files metadata
      const fileSpecs = await Promise.all(
        files.map(async (file) => {
          const sampleBuffer = await file.slice(0, Math.min(file.size, CHUNK_SIZE)).arrayBuffer();
          const sha256 = await calculateSHA256(sampleBuffer);
          const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
          return {
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || 'application/octet-stream',
            sha256Checksum: sha256,
            chunkSizeBytes: CHUNK_SIZE,
            totalChunks,
          };
        })
      );

      // 2. Initialize transfer with backend
      const initRes = await fetch('/api/v1/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: files.length === 1 ? files[0].name : `${files.length} Files Transfer`,
          expiryType: options.expiryType || '24_HOURS',
          password: options.password || undefined,
          transferMode: options.transferMode || 'CLOUD_CHUNK',
          files: fileSpecs,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || 'Failed to initialize upload session');
      }

      const { transferId, shareCode, shareUrl, files: createdFiles } = initData;
      const totalChunksAcrossAllFiles = fileSpecs.reduce((acc, f) => acc + f.totalChunks, 0);
      let uploadedChunksCount = 0;
      const startTime = Date.now();

      // 3. Multi-Lane Parallel Worker Pool Upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dbFile = (createdFiles && createdFiles[i]) ? createdFiles[i] : { id: 'file_' + i };
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

        // Create tasks queue for parallel execution
        const chunkIndices = Array.from({ length: totalChunks }, (_, idx) => idx);

        // Process chunks with PARALLEL_WORKERS concurrency pool
        const processChunk = async (chunkIndex: number) => {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);
          const chunkBuffer = await chunkBlob.arrayBuffer();
          const sha256Checksum = await calculateSHA256(chunkBuffer);

          const formData = new FormData();
          formData.append('chunk', chunkBlob);

          let success = false;
          let retries = 3;
          let lastErrMsg = '';

          while (!success && retries > 0) {
            try {
              const uploadRes = await fetch(
                `/api/v1/transfers/${transferId}/files/${dbFile.id}/chunks/${chunkIndex}`,
                {
                  method: 'POST',
                  headers: { 'x-checksum-sha256': sha256Checksum },
                  body: formData,
                }
              );

              if (uploadRes.ok) {
                success = true;
              } else {
                const errJson = await uploadRes.json().catch(() => ({}));
                lastErrMsg = errJson.error || `HTTP ${uploadRes.status}`;
                retries--;
              }
            } catch (err: any) {
              lastErrMsg = err.message || 'Network error';
              retries--;
              await new Promise((r) => setTimeout(r, 500));
            }
          }

          if (!success) {
            throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${lastErrMsg}`);
          }

          uploadedChunksCount++;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const totalBytesUploaded = uploadedChunksCount * CHUNK_SIZE;
          const speedBps = elapsedTime > 0 ? totalBytesUploaded / elapsedTime : 0;
          updateProgress(uploadedChunksCount, totalChunksAcrossAllFiles, speedBps);
        };

        // Run worker pool
        for (let j = 0; j < chunkIndices.length; j += PARALLEL_WORKERS) {
          const batch = chunkIndices.slice(j, j + PARALLEL_WORKERS);
          await Promise.all(batch.map((idx) => processChunk(idx)));
        }
      }

      setIsUploading(false);
      return { transferId, shareCode, shareUrl };
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadFile, isUploading, error };
}
