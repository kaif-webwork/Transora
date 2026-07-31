'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, HardDrive, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    <div className="w-full glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Zap className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {isUploading ? 'Uploading File Chunks...' : 'Transfer Processing'}
            </h4>
            <p className="text-xs text-slate-400">5MB Parallel Multi-Worker Lane</p>
          </div>
        </div>

        <span className="text-2xl font-black text-gradient font-mono">
          {progress.percentage}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-600 via-neon-purple to-neon-cyan"
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
    </div>
  );
}
