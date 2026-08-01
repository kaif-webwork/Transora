import { useState } from 'react';
import { getDirectBackendDownloadUrl } from '../lib/api';

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
    setProgress(10);
    setError(null);

    try {
      let fakeProg = 10;
      const interval = setInterval(() => {
        fakeProg = Math.min(fakeProg + 10, 95);
        setProgress(fakeProg);
      }, 300);

      // Direct backend download stream URL bypassing Vercel edge proxy and JS memory buffering
      const downloadUrl = getDirectBackendDownloadUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName || 'download';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setIsDownloading(false);
        }, 1000);
      }, 1500);
    } catch (err: any) {
      console.error('[Download Failed]', err);
      setError(err.message || 'Download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, progress, error };
}
