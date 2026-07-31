'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sun, Eye, Zap, Camera, ShieldCheck } from 'lucide-react';

interface OpticalStreamerProps {
  dataChunks: string[];
}

export function OpticalStreamer({ dataChunks }: OpticalStreamerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(15); // 15 frames per second optical flash
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && dataChunks.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % dataChunks.length);
      }, 1000 / fps);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, fps, dataChunks.length]);

  if (!dataChunks || dataChunks.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-cyan-500/30 space-y-6 glow-cyan text-center">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Sun className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Visual Optical Light Transfer (Li-Fi Mode)</h4>
            <p className="text-xs text-slate-400">High-Speed Screen Light Flash Transmission</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
          Zero Radio Spectrum
        </span>
      </div>

      {/* Optical Light Display Stage */}
      <div className="p-6 bg-white rounded-3xl inline-block shadow-2xl shadow-cyan-500/20 my-2">
        <QRCodeSVG value={dataChunks[currentFrame]} size={220} level="M" />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono max-w-sm mx-auto">
        <span>Optical Frame: {currentFrame + 1} / {dataChunks.length}</span>
        <span>Speed: {fps} FPS</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center gap-2 ${
            isPlaying
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-gradient-to-r from-cyan-600 to-brand-600 text-white'
          }`}
        >
          {isPlaying ? 'Pause Light Stream' : 'Start Optical Light Flash'}
        </button>

        <select
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 outline-none"
        >
          <option value={10}>10 FPS (Normal Camera)</option>
          <option value={15}>15 FPS (Fast)</option>
          <option value={30}>30 FPS (Ultra-Fast Optical)</option>
        </select>
      </div>

      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 text-left flex items-start gap-2">
        <Camera className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          Receiver opens camera scanner on mobile. High-speed light flashes transmit raw binary chunks directly screen-to-camera with zero radio spectrum, zero Bluetooth, and zero network data!
        </span>
      </div>
    </div>
  );
}
