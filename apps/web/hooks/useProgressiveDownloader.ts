import { useState } from 'react';
import { getDirectBackendDownloadUrl } from '../lib/api';

export function useProgressiveDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 MB/s');
  const [error, setError] = useState<string | null>(null);

  const downloadTransfer = async (
    transferId: string,
    fileId: string,
    fileName: string,
    fileSizeBytes?: number
  ) => {
    setIsDownloading(true);
    setDownloadStarted(true);
    setError(null);

    const queryParams = `?fileName=${encodeURIComponent(fileName)}&fileSize=${fileSizeBytes || 0}`;
    const downloadUrl = getDirectBackendDownloadUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download${queryParams}`);

    try {
      // Direct Chrome Native Attachment Download Trigger
      window.location.href = downloadUrl;

      setTimeout(() => {
        setIsDownloading(false);
      }, 3000);
    } catch (err: any) {
      console.error('[Native Downloader Error]', err);
      setError(err.message || 'Download failed');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, downloadStarted, progress, downloadSpeed, error };
}
