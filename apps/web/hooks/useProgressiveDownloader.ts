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
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: File unavailable or expired`);
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
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 100);
        setProgress(100);
        setTimeout(() => setIsDownloading(false), 1500);
        return;
      }

      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
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

      // Create Same-Origin Blob URL so Chrome 100% respects the download attribute without top-level page navigation
      const blob = new Blob(chunks, { type: 'application/octet-stream' });
      const sameOriginBlobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = sameOriginBlobUrl;
      a.download = fileName || 'downloaded_file';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(sameOriginBlobUrl);
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 500);

      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (err: any) {
      console.error('[In-Page Downloader Error]', err);
      // NEVER navigate top-level window to cross-origin URLs on error!
      setError(err.message || 'Download failed: File unavailable on server');
      setIsDownloading(false);
    }
  };

  return { downloadTransfer, isDownloading, downloadStarted, progress, downloadSpeed, error };
}
