'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Zap, History, Settings, User as UserIcon, LayoutDashboard, QrCode, Camera } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { QRScannerModal } from './QRScannerModal';

export function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [showScanner, setShowScanner] = useState(false);

  const navLinks = [
    { href: '/', label: 'Transfer', icon: Zap },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/70 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-neon-purple to-neon-cyan flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                SwiftShare
                <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  PRO
                </span>
              </span>
              <p className="text-xs text-slate-400">Share Anything. Instantly.</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-white/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* Receiver Camera Scan Button */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold text-xs hover:bg-cyan-500/30 transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan & Receive</span>
            </button>

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-white/10 text-sm text-slate-200 hover:bg-slate-800 transition"
              >
                <UserIcon className="w-4 h-4 text-brand-400" />
                <span>{user.fullName}</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-brand-600 via-indigo-600 to-neon-purple text-white shadow-lg shadow-brand-500/25 hover:brightness-110 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {showScanner && <QRScannerModal onClose={() => setShowScanner(false)} />}
    </>
  );
}
