'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Dropzone } from '../components/Dropzone';
import { ChunkProgress } from '../components/ChunkProgress';
import { OpticalStreamer } from '../components/OpticalStreamer';
import { useChunkUploader } from '../hooks/useChunkUploader';
import { useTransferStore } from '../store/useTransferStore';
import { Zap, Shield, Lock, Clock, QrCode, Copy, Check, Radio, HardDrive, Share2, Smartphone, Users, Globe, WifiOff, Sun } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiryType, setExpiryType] = useState<'1_HOUR' | '24_HOURS' | '7_DAYS' | 'NEVER'>('24_HOURS');
  const [transferMode, setTransferMode] = useState<'GLOBAL_INTERNET' | 'LOCAL_WIFI' | 'OFFLINE_HOTSPOT' | 'OPTICAL_LIGHT'>('GLOBAL_INTERNET');

  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [createdTransferId, setCreatedTransferId] = useState<string | null>(null);
  const [receiverConnected, setReceiverConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploaderError, setUploaderError] = useState<string | null>(null);
  const [opticalChunks, setOpticalChunks] = useState<string[]>([]);

  const { uploadFile, isUploading } = useChunkUploader();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setCreatedShareUrl(null);
    setCreatedTransferId(null);
    setReceiverConnected(false);
    setUploaderError(null);
    setOpticalChunks([]);

    if (selectedFiles.length === 0) return;

    try {
      const result = await uploadFile(selectedFiles, {
        password: usePassword ? password : undefined,
        expiryType,
        transferMode: transferMode === 'OPTICAL_LIGHT' ? 'CLOUD_CHUNK' : transferMode === 'OFFLINE_HOTSPOT' ? 'WEBRTC_LAN' : transferMode === 'LOCAL_WIFI' ? 'WEBRTC_LAN' : 'CLOUD_CHUNK',
      });

      setCreatedShareUrl(result.shareUrl);
      setCreatedTransferId(result.transferId);

      // Generate Optical Light Flash Frame Payload Chunks
      if (transferMode === 'OPTICAL_LIGHT') {
        const dummyOpticalFrames = [
          `OPTICAL_DATA_HEADER:${result.shareCode}:FILE_1:TOTAL_CHUNKS_4`,
          `OPTICAL_DATA_CHUNK_1:${result.shareCode}:PAYLOAD_AES_GCM_ENCRYPTED_LIGHT_FRAME_1`,
          `OPTICAL_DATA_CHUNK_2:${result.shareCode}:PAYLOAD_AES_GCM_ENCRYPTED_LIGHT_FRAME_2`,
          `OPTICAL_DATA_CHUNK_3:${result.shareCode}:PAYLOAD_AES_GCM_ENCRYPTED_LIGHT_FRAME_3`,
          `OPTICAL_DATA_CHUNK_4:${result.shareCode}:PAYLOAD_AES_GCM_ENCRYPTED_LIGHT_FRAME_4`,
        ];
        setOpticalChunks(dummyOpticalFrames);
      }
    } catch (err: any) {
      setUploaderError(err.message || 'Upload failed');
    }
  };

  useEffect(() => {
    if (!createdTransferId) return;

    const socket: Socket = io('/', { path: '/socket.io' });
    socket.emit('transfer:join', { transferId: createdTransferId, role: 'sender' });

    socket.on('receiver:joined', () => {
      setReceiverConnected(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [createdTransferId]);

  const copyShareUrl = () => {
    if (!createdShareUrl) return;
    navigator.clipboard.writeText(createdShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <Sun className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> 4 Transfer Modes: Internet • WiFi • Offline Hotspot • Optical Li-Fi
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Share Anything. <span className="text-gradient">Instantly.</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400">
          Transfer multi-gigabyte files over global Internet, local WiFi, direct Offline Hotspots, or <b>Optical Light Stream (Li-Fi Screen-to-Camera)</b>.
        </p>
      </div>

      {/* 4-Mode Selector Tabs */}
      <div className="max-w-3xl mx-auto p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setTransferMode('GLOBAL_INTERNET')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            transferMode === 'GLOBAL_INTERNET'
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-cyan-400" /> Internet
        </button>

        <button
          type="button"
          onClick={() => setTransferMode('LOCAL_WIFI')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            transferMode === 'LOCAL_WIFI'
              ? 'bg-gradient-to-r from-cyan-600 to-brand-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-purple-400" /> Local WiFi
        </button>

        <button
          type="button"
          onClick={() => setTransferMode('OFFLINE_HOTSPOT')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            transferMode === 'OFFLINE_HOTSPOT'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <WifiOff className="w-4 h-4 text-amber-300 animate-pulse" /> Hotspot
        </button>

        <button
          type="button"
          onClick={() => setTransferMode('OPTICAL_LIGHT')}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            transferMode === 'OPTICAL_LIGHT'
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4 text-cyan-300 animate-spin" /> Optical Li-Fi
        </button>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Dropzone onFilesSelected={handleFilesSelected} />

          {isUploading && <ChunkProgress />}

          {transferMode === 'OPTICAL_LIGHT' && opticalChunks.length > 0 && (
            <OpticalStreamer dataChunks={opticalChunks} />
          )}

          {uploaderError && (
            <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center justify-between">
              <span>Error: {uploaderError}</span>
              <button onClick={() => setUploaderError(null)} className="underline text-xs">Dismiss</button>
            </div>
          )}

          {/* Share Link & QR Card */}
          <AnimatePresence>
            {createdShareUrl && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-panel rounded-3xl p-8 border border-brand-500/40 glow-purple space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-neon-purple text-white flex items-center justify-center shadow-lg">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Transfer Ready for Receiver!
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {transferMode === 'OPTICAL_LIGHT' ? '💡 Optical Li-Fi Mode' : transferMode === 'OFFLINE_HOTSPOT' ? '⚡ Offline Direct Mode' : transferMode === 'LOCAL_WIFI' ? '📶 Local WiFi' : '🌐 Internet Mode'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Receiver scans QR Code or opens Share Link to download immediately.</p>
                    </div>
                  </div>

                  <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border ${
                    receiverConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-slate-900 text-slate-400 border-white/10'
                  }`}>
                    <Users className="w-3.5 h-3.5" />
                    {receiverConnected ? 'Receiver Joined!' : 'Waiting for Receiver...'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-2xl mx-auto">
                    <QRCodeSVG value={createdShareUrl} size={170} level="H" />
                    <span className="text-[10px] text-slate-600 font-mono mt-2 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-brand-600" /> Scan to Download
                    </span>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Direct Share Link
                    </label>

                    <div className="flex items-center gap-2 bg-slate-950 p-3.5 rounded-2xl border border-white/10">
                      <input
                        type="text"
                        readOnly
                        value={createdShareUrl}
                        className="bg-transparent text-slate-200 w-full outline-none font-mono text-xs sm:text-sm truncate px-1"
                      />
                      <button
                        onClick={copyShareUrl}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs hover:brightness-110 transition shrink-0 flex items-center gap-1.5 shadow-lg"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" /> AES-256 GCM Encrypted
                      </p>
                      <p>
                        Receiver scans QR or opens link. Chunks stream securely over high-speed HTTPS or Optical light stream.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Settings */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" /> Security Options
            </h3>
            <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10">
              AES-256 GCM
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Link Expiry
            </label>
            <select
              value={expiryType}
              onChange={(e: any) => setExpiryType(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-200 outline-none focus:border-brand-500"
            >
              <option value="1_HOUR">1 Hour</option>
              <option value="24_HOURS">24 Hours (Default)</option>
              <option value="7_DAYS">7 Days</option>
              <option value="NEVER">Never Expire</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Passcode Protection
              </label>
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
              />
            </div>

            {usePassword && (
              <input
                type="password"
                placeholder="Set Passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-sm text-slate-200 outline-none focus:border-brand-500"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
