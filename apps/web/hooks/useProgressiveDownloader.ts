import { useState } from 'react';
import { getBackendApiUrl } from '../lib/api';

const PARALLEL_DOWNLOAD_WORKERS = 6; // 6 Parallel HTTP GET Download Lanes

export function useProgressiveDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadTransfer = async (
    transferId: string,
    fileId: string,
    fileName: string,
    totalChunks: number
  ) => {
    setIsDownloading(true);
    setProgress(0);
    setError(null);

    const chunkBlobs: Blob[] = new Array(totalChunks);
    let downloadedCount = 0;

    try {
      const chunkIndices = Array.from({ length: totalChunks }, (_, idx) => idx);

      const fetchSingleChunk = async (chunkIndex: number) => {
        let downloaded = false;
        let retries = 10;

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
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
          } catch (err) {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }

        if (!downloaded) {
          throw new Error(`Timeout waiting for chunk ${chunkIndex + 1}`);
        }

        downloadedCount++;
        setProgress(Math.round((downloadedCount / totalChunks) * 100));
      };

      // Execute 6-lane parallel chunk fetch pool
      for (let i = 0; i < chunkIndices.length; i += PARALLEL_DOWNLOAD_WORKERS) {
        const batch = chunkIndices.slice(i, i + PARALLEL_DOWNLOAD_WORKERS);
        await Promise.all(batch.map((idx) => fetchSingleChunk(idx)));
      }

      // Assemble Chunks in exact numerical order & trigger direct browser save
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
      setError(err.message || 'Progressive download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, progress, error };
}
