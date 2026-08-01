'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RefreshCw, Zap, Upload, CheckCircle2, ShieldCheck, Keyboard, ArrowRight, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  onClose: () => void;
}

export function QRScannerModal({ onClose }: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const router = useRouter();

  // Helper to extract share code or path from scanned string
  const handleDecodedText = (text: string) => {
    let cleanCode = text.trim();

    // If text is a full URL e.g. https://transora-web.vercel.app/receive/ABC1234
    if (cleanCode.includes('/receive/')) {
      const parts = cleanCode.split('/receive/');
      cleanCode = parts[parts.length - 1].split('?')[0].split('#')[0];
    } else if (cleanCode.includes('http://') || cleanCode.includes('https://')) {
      try {
        const parsedUrl = new URL(cleanCode);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        cleanCode = pathSegments[pathSegments.length - 1] || cleanCode;
      } catch (e) {
        // Fallback
      }
    }

    if (cleanCode) {
      setScannedResult(cleanCode);
      // Trigger haptic vibration if supported
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }
      setTimeout(() => {
        router.push(`/receive/${encodeURIComponent(cleanCode)}`);
        onClose();
      }, 600);
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animFrameId: number | null = null;
    let isActive = true;

    async function initScanner() {
      try {
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });

        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();

          // Start scanning frame loop
          requestAnimationFrame(scanLoop);
        }
      } catch (err: any) {
        setError('Camera permission denied or camera not accessible on this device.');
      }
    }

    function scanLoop() {
      if (!isActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleDecodedText(code.data);
            return; // Stop scanning once found
          }
        }
      }

      animFrameId = requestAnimationFrame(scanLoop);
    }

    initScanner();

    return () => {
      isActive = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Handle uploading QR Code Image file from photo gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDecodedText(code.data);
          } else {
            setError('No valid QR code detected in the selected image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDecodedText(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-cyan-500/30 text-center space-y-6 glow-cyan shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Zap className="w-5 h-5 animate-pulse text-cyan-300" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-white leading-tight">Live Scanner</h3>
              <p className="text-[11px] text-slate-400">Point at QR code or enter code</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              title="Switch Camera"
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Scan Feedback Alert */}
        <AnimatePresence>
          {scannedResult && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
              QR Code Lock! Connecting to {scannedResult}...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewfinder / Camera Viewport */}
        {error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium space-y-3">
            <p>{error}</p>
            <button
              onClick={() => setShowManualInput(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-500 transition shadow-lg"
            >
              Enter Code Manually
            </button>
          </div>
        ) : (
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center shadow-inner">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Cyber Viewfinder Overlay with Corner Brackets & Laser Scanning Beam */}
            <div className="absolute inset-0 pointer-events-none p-8 flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl">
                {/* 4 Neon Target Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl shadow-[0_0_15px_#22d3ee]" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl shadow-[0_0_15px_#22d3ee]" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl shadow-[0_0_15px_#22d3ee]" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl shadow-[0_0_15px_#22d3ee]" />

                {/* Animated Laser Scanning Line */}
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]"
                />
              </div>
            </div>

            {/* Bottom Floating Controls */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10 text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Auto-Detect Active
              </span>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1 transition"
              >
                <ImageIcon className="w-3.5 h-3.5 text-brand-400" /> Upload Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Manual Share Code Expandable Fallback */}
        <div className="pt-1">
          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              className="text-xs text-slate-400 hover:text-cyan-300 transition flex items-center justify-center gap-1.5 mx-auto font-medium"
            >
              <Keyboard className="w-4 h-4 text-brand-400" /> Have a Share Code? Enter manually
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter Code (e.g. ABC1234)"
                className="flex-1 bg-slate-900 border border-white/15 rounded-xl px-4 py-2 text-xs text-white uppercase tracking-widest outline-none focus:border-brand-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-lg"
              >
                Join <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
