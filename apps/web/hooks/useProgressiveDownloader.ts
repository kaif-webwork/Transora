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
    setProgress(0);
    setDownloadSpeed('0 MB/s');
    setError(null);

    const downloadUrl = getDirectBackendDownloadUrl(`/api/v1/transfers/${transferId}/files/${fileId}/download`);

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download request failed with status ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : (fileSizeBytes || 0);

      if (!response.body) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'downloaded_file';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setProgress(100);
        setTimeout(() => setIsDownloading(false), 1500);
        return;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      let startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          if (totalBytes > 0) {
            const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
            setProgress(pct);
          }

          const elapsedTimeSec = (Date.now() - startTime) / 1000;
          if (elapsedTimeSec > 0.5) {
            const speedMBps = (receivedBytes / (1024 * 1024) / elapsedTimeSec).toFixed(1);
            setDownloadSpeed(`${speedMBps} MB/s`);
          }
        }
      }

      setProgress(100);

      // Save file cleanly without navigating away from the receive page
      const blob = new Blob(chunks, { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'downloaded_file';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);

      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (err: any) {
      console.error('[In-Page Downloader Error]', err);
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'downloaded_file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setProgress(100);
      } catch (e) {
        setError(err.message || 'Download failed');
      } finally {
        setTimeout(() => setIsDownloading(false), 2000);
      }
    }
  };

  return { downloadTransfer, isDownloading, downloadStarted, progress, downloadSpeed, error };
}
