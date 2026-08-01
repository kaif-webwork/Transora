import { useState } from 'react';
import { getBackendApiUrl } from '../lib/api';

const PARALLEL_DOWNLOAD_WORKERS = 12;

function getAdaptiveChunkSize(fileSize: number): number {
  if (fileSize < 50 * 1024 * 1024) return 4 * 1024 * 1024;
  if (fileSize < 500 * 1024 * 1024) return 8 * 1024 * 1024;
  return 16 * 1024 * 1024;
}

export function useProgressiveDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadTransfer = async (
    transferId: string,
    fileId: string,
    fileName: string,
    fileSizeBytes: number,
    explicitTotalChunks?: number
  ) => {
    setIsDownloading(true);
    setProgress(0);
    setError(null);

    const chunkSize = getAdaptiveChunkSize(fileSizeBytes || 1024 * 1024);
    const calculatedChunks = Math.max(1, Math.ceil((fileSizeBytes || 1024 * 1024) / chunkSize));
    const totalChunks = explicitTotalChunks && explicitTotalChunks > 0 ? explicitTotalChunks : calculatedChunks;

    const chunkBlobs: Blob[] = new Array(totalChunks);
    let downloadedCount = 0;

    try {
      const chunkIndices = Array.from({ length: totalChunks }, (_, idx) => idx);

      const fetchSingleChunk = async (chunkIndex: number) => {
        let downloaded = false;
        let retries = 5;

        while (!downloaded && retries > 0) {
          try {
            const chunkUrl = getBackendApiUrl(`/api/v1/transfers/${transferId}/files/${fileId}/chunks/${chunkIndex}`);
            const res = await fetch(chunkUrl);
            if (res.ok) {
              const blob = await res.blob();
              chunkBlobs[chunkIndex] = blob;
              downloaded = true;
            } else {
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 300));
              }
            }
          } catch (err) {
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }

        if (!downloaded) {
          throw new Error(`Timeout waiting for chunk ${chunkIndex + 1}`);
        }

        downloadedCount++;
        setProgress(Math.round((downloadedCount / totalChunks) * 100));
      };

      for (let i = 0; i < chunkIndices.length; i += PARALLEL_DOWNLOAD_WORKERS) {
        const batch = chunkIndices.slice(i, i + PARALLEL_DOWNLOAD_WORKERS);
        await Promise.all(batch.map((idx) => fetchSingleChunk(idx)));
      }

      const fullBlob = new Blob(chunkBlobs, { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(fullBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsDownloading(false);
    } catch (err: any) {
      console.error('[ProgressiveDownloader Error]', err);
      setError(err.message || 'Progressive download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, progress, error };
}
