'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History as HistoryIcon, Zap, Copy, Check, ShieldCheck } from 'lucide-react';

export default function HistoryPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/transfers')
      .then((res) => res.json())
      .then((data) => setTransfers(data.transfers || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/receive/${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareCode);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-indigo-400" /> Transfer History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access your recent file transfers, share links, and live streaming statuses.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:brightness-110 transition flex items-center gap-2"
        >
          <Zap className="w-4 h-4" /> New Transfer
        </Link>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-400 bg-slate-900/60 border-b border-white/10">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Size</th>
                <th className="p-4">Share Code</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    Loading transfer history...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No transfers created yet. Drop files on the home page to start transferring.
                  </td>
                </tr>
              ) : (
                transfers.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-semibold text-white">{item.title}</td>
                    <td className="p-4 font-mono text-xs">{formatSize(item.total_size_bytes)}</td>
                    <td className="p-4 font-mono text-xs text-brand-300">{item.share_code}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(item.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => copyShareLink(item.share_code)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
                      >
                        {copiedId === item.share_code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === item.share_code ? 'Copied' : 'Copy Link'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
