import { useState } from 'react';
import { getDirectBackendDownloadUrl } from '../lib/api';

export function useProgressiveDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadTransfer = async (
    transferId: string,
    fileId: string,
    fileName: string,
    fileSizeBytes?: number
  ) => {
    setIsDownloading(true);
    setDownloadStarted(false);
    setError(null);

    try {
      // Direct backend download stream URL bypassing Vercel edge proxy and JS memory buffering
      const downloadUrl = getDirectBackendDownloadUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

      // Trigger native browser download stream directly on current page so NO blank Loading... tab opens
      window.location.href = downloadUrl;

      setDownloadStarted(true);
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (err: any) {
      console.error('[Download Failed]', err);
      setError(err.message || 'Download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, downloadStarted, progress: 0, error };
}
