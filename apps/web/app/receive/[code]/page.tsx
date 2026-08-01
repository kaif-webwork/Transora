'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DownloadCloud, ShieldCheck, Lock, File, CheckCircle2 } from 'lucide-react';
import { useProgressiveDownloader } from '../../../hooks/useProgressiveDownloader';
import { getBackendApiUrl } from '../../../lib/api';
import { io, Socket } from 'socket.io-client';

export default function ReceivePage() {
  const params = useParams();
  const shareCode = params.code as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [transferData, setTransferData] = useState<any>(null);

  const { downloadTransfer, isDownloading, progress } = useProgressiveDownloader();

  const fetchTransferInfo = async (passcode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const shareApiUrl = getBackendApiUrl(`/api/v1/share/${shareCode}${passcode ? `?password=${encodeURIComponent(passcode)}` : ''}`);
      const res = await fetch(shareApiUrl);

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      } else {
        throw new Error('Transfer link unresolvable. Please check backend connection.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch transfer link');
      }

      if (data.requiresPassword) {
        setRequiresPassword(true);
      } else {
        setRequiresPassword(false);
        setTransferData(data.transfer);

        // Notify Socket.IO room that receiver has arrived
        if (data.transfer && data.transfer.id) {
          try {
            const socketUrl = getBackendApiUrl('/');
            const socket: Socket = io(socketUrl, { path: '/socket.io' });
            socket.emit('transfer:join', { transferId: data.transfer.id, role: 'receiver' });
          } catch (e) {
            // Socket connection optional for fallback
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Transfer not found or expired');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shareCode) {
      fetchTransferInfo();
    }
  }, [shareCode]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransferInfo(password);
  };

  const handleDownloadAll = () => {
    if (!transferData || !transferData.files || transferData.files.length === 0) return;
    for (const file of transferData.files) {
      downloadTransfer(
        transferData.id,
        file.id,
        file.file_name,
        file.file_size_bytes || transferData.total_size_bytes || 1024 * 1024
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      {loading ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Connecting to Transora Transfer Stream...</p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border-rose-500/30">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h3 className="text-xl font-bold text-white">Transfer Unavailable</h3>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      ) : requiresPassword ? (
        <form onSubmit={handlePasswordSubmit} className="glass-panel rounded-3xl p-8 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Passcode Required</h3>
            <p className="text-xs text-slate-400 mt-1">Enter passcode to access this shared transfer.</p>
          </div>
          <input
            type="password"
            placeholder="Enter Passcode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-200 outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-500 transition shadow-lg"
          >
            Unlock Files
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6 glow-cyan"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">{transferData?.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Size: {formatSize(transferData?.total_size_bytes)} ({transferData?.total_chunks} Chunks)
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 Verified
            </span>
          </div>

          {/* 1-Click Instant Download Button */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-brand-600 to-neon-purple text-white font-bold text-base shadow-xl hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <DownloadCloud className="w-5 h-5 animate-bounce" />
            {isDownloading ? `${progress}% Streaming Chunks...` : 'Instant 1-Click Download All'}
          </button>

          {/* Individual File Items */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File Contents</h4>
            {transferData?.files?.map((file: any) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/10 text-sm"
              >
                <div className="flex items-center gap-3 truncate">
                  <File className="w-5 h-5 text-brand-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-white truncate">{file.file_name}</p>
                    <p className="text-xs text-slate-400">{formatSize(file.file_size_bytes)}</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    downloadTransfer(
                      transferData.id,
                      file.id,
                      file.file_name,
                      file.file_size_bytes || 1024 * 1024
                    )
                  }
                  disabled={isDownloading}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition shrink-0 flex items-center gap-1.5"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
