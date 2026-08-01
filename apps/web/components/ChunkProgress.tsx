'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, HardDrive, ShieldCheck, Wifi } from 'lucide-react';
import { useTransferStore } from '../store/useTransferStore';

export function ChunkProgress() {
  const { progress, isUploading } = useTransferStore();

  const formatSpeed = (bps: number) => {
    if (bps === 0) return '0 MB/s';
    const mbps = bps / (1024 * 1024);
    return `${mbps.toFixed(2)} MB/s`;
  };

  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Calculating...';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-cyan-500/30 space-y-4 glow-cyan">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Zap className="w-4 h-4 animate-spin text-cyan-300" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              {isUploading ? 'Streaming 16MB Turbo Chunks...' : 'Transfer Processing'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⚡ Zero-Wait Streaming Active
              </span>
            </h4>
            <p className="text-xs text-slate-400">16MB Turbo Multi-Lane Pipeline (12 Concurrent Workers)</p>
          </div>
        </div>

        <span className="text-2xl font-black text-gradient font-mono">
          {progress.percentage}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-brand-500 to-neon-purple"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-start">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Current Speed
          </span>
          <span className="text-sm font-bold text-white font-mono mt-1">
            {formatSpeed(progress.currentSpeedBps)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-start">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" /> Estimated Time
          </span>
          <span className="text-sm font-bold text-white font-mono mt-1">
            {formatEta(progress.etaSeconds)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col items-start">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" /> Chunks Uploaded
          </span>
          <span className="text-sm font-bold text-white font-mono mt-1">
            {progress.uploadedChunks} / {progress.totalChunks}
          </span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
        <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          💡 <strong>Tip for 100MB/s Ultra Speed:</strong> For nearby devices, select <strong>Local WiFi</strong> mode to bypass cloud internet limits!
        </span>
      </div>
    </div>
  );
}
