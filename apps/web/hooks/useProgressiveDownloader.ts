import { useState } from 'react';
import { getBackendApiUrl } from '../lib/api';

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
    setProgress(100);
    setError(null);

    try {
      // Direct Native Browser Download Stream URL (Zero RAM Overhead & Max Gigabit Network Speed)
      const downloadUrl = getBackendApiUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        setIsDownloading(false);
      }, 1500);
    } catch (err: any) {
      console.error('[Download Error]', err);
      setError(err.message || 'Download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, progress, error };
}
