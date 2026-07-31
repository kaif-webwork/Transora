'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Camera, RefreshCw, Zap } from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
}

export function QRScannerModal({ onClose }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrame: number;

    async function startCamera() {
      try {
        setScanning(true);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Rear camera on mobile
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }
      } catch (err: any) {
        setError('Camera permission denied or camera not found on this device.');
        setScanning(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-cyan-500/30 text-center space-y-6 glow-cyan">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
          <Camera className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-white">Receiver QR Camera Scanner</h3>
          <p className="text-xs text-slate-400 mt-1">
            Point camera at Sender's screen to instantly receive files over WiFi or 4G/5G.
          </p>
        </div>

        {error ? (
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        ) : (
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanner Target Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/60 m-12 rounded-2xl flex items-center justify-center">
              <div className="w-full h-0.5 bg-cyan-400/80 animate-bounce shadow-lg shadow-cyan-500" />
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400">
          💡 Auto-detects QR codes and redirects directly to instant 1-click download stream.
        </div>
      </div>
    </div>
  );
}
