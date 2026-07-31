'use client';

import { Settings as SettingsIcon, Shield, HardDrive, Key, Bell, Wifi } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-brand-400" /> Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure default transfer expirations, WebRTC P2P acceleration, and security preferences.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" /> WebRTC Local WiFi Discovery
            </h3>
            <p className="text-xs text-slate-400">
              Automatically stream files directly over LAN when sender and receiver are on the same router.
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-brand-500 cursor-pointer" />
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Default Client-Side AES-256 E2EE
            </h3>
            <p className="text-xs text-slate-400">
              Encrypt chunks in local browser memory before uploading to cloud storage.
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-brand-500 cursor-pointer" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Desktop & Push Notifications
            </h3>
            <p className="text-xs text-slate-400">
              Receive instant alerts when a receiver connects to your live transfer room.
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-brand-500 cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
