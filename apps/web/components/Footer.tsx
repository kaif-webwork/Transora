'use client';

import { Shield, Zap, Lock, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/80 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-slate-400">
            © 2026 Transora Platform. Enterprise-Grade Ultra-Fast File Transfer.
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 hover:text-white transition">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition">
            <Globe className="w-3.5 h-3.5 text-cyan-400" /> WebRTC Local Network P2P
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Zero File Restrictions
          </span>
        </div>
      </div>
    </footer>
  );
}
