'use client';

import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 border border-white/10 text-center space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 mx-auto flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-white">Scan to Download</h3>
          <p className="text-xs text-slate-400 mt-1">
            Point your iOS, Android, or tablet camera to receive instantly.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl shadow-brand-500/10">
          <QRCodeSVG value={url} size={200} level="H" />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-white/10 text-xs">
          <input
            type="text"
            readOnly
            value={url}
            className="bg-transparent text-slate-300 w-full outline-none truncate font-mono"
          />
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
