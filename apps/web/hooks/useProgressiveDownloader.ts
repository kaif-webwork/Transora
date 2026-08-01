import { useState } from 'react';
import { getBackendApiUrl } from '../lib/api';

const PARALLEL_DOWNLOAD_WORKERS = 8;

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
    fileSizeBytes?: number
  ) => {
    setIsDownloading(true);
    setProgress(0);
    setError(null);

    const validSize = fileSizeBytes && fileSizeBytes > 0 ? fileSizeBytes : 1024 * 1024;
    const chunkSize = getAdaptiveChunkSize(validSize);
    const totalChunks = Math.max(1, Math.ceil(validSize / chunkSize));

    try {
      // For large files (> 1GB), use hidden iframe to stream directly without memory overload or page redirect
      if (validSize > 1024 * 1024 * 1024) {
        let fakeProg = 5;
        setProgress(fakeProg);
        const interval = setInterval(() => {
          fakeProg = Math.min(fakeProg + 5, 95);
          setProgress(fakeProg);
        }, 800);

        const downloadUrl = getBackendApiUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

        let iframe = document.getElementById('hidden-download-iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'hidden-download-iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        iframe.src = downloadUrl;

        setTimeout(() => {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => {
            setIsDownloading(false);
          }, 1500);
        }, 4000);

        return;
      }

      // Progressive multi-chunk download with live UI percentage progress (0% -> 100%)
      const chunkBlobs: Blob[] = new Array(totalChunks);
      let downloadedCount = 0;
      const chunkIndices = Array.from({ length: totalChunks }, (_, idx) => idx);

      const fetchSingleChunk = async (chunkIndex: number) => {
        let downloaded = false;
        let retries = 25; // Retry up to 25 times (12.5 seconds) for real-time background uploads

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
              if (retries > 0) await new Promise((r) => setTimeout(r, 500));
            }
          } catch (err) {
            retries--;
            if (retries > 0) await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!downloaded) {
          throw new Error(`Chunk ${chunkIndex + 1} stream pending`);
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
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProgress(100);
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    } catch (err: any) {
      console.warn('[Progressive Downloader Fallback Triggered]', err);
      // Fallback: Trigger silent hidden iframe stream without redirecting page
      const downloadUrl = getBackendApiUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);
      let iframe = document.getElementById('hidden-download-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hidden-download-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
      iframe.src = downloadUrl;

      setProgress(100);
      setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    }
  };

  return { downloadTransfer, isDownloading, progress, error };
}
