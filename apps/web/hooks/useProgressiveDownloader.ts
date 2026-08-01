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
      const downloadUrl = getDirectBackendDownloadUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

      // Trigger browser native file download stream via hidden anchor element without top-level window navigation
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

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
