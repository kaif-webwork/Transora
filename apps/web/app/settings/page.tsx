'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Wifi, Bell, Server, Check } from 'lucide-react';
import { getStoredBackendUrl, setCustomBackendUrl } from '../../lib/api';

export default function SettingsPage() {
  const [backendUrl, setBackendUrlInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBackendUrlInput(getStoredBackendUrl());
  }, []);

  const handleSave = () => {
    setCustomBackendUrl(backendUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-brand-400" /> Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure default transfer expirations, WebRTC P2P acceleration, and backend connectivity.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
        <div className="pb-4 border-b border-white/10 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" /> Backend API Server URL
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your live deployed Railway / Render backend URL (e.g. <code>https://your-backend.up.railway.app</code>).
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrlInput(e.target.value)}
              placeholder="https://your-backend.up.railway.app"
              className="flex-1 bg-slate-900/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              {saved ? 'Saved!' : 'Save URL'}
            </button>
          </div>
        </div>

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
