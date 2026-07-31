'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, HardDrive, Zap, History, ArrowUpRight, ShieldCheck, Download, Clock, Copy, Check } from 'lucide-react';

export default function DashboardPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    totalStorageBytes: 0,
    activeTransfers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch('/api/v1/admin/stats').catch(() => null);
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalTransfers: statsData.totalTransfers || 0,
          totalStorageBytes: statsData.totalStorageBytes || 0,
          activeTransfers: statsData.activeTransfers || 0,
        });
      }

      const transfersRes = await fetch('/api/v1/admin/transfers').catch(() => null);
      if (transfersRes && transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData.transfers || []);
      }
    } catch (err) {
      console.error('Failed to load live dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-brand-400" /> Real-Time Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Live metrics connected to SwiftShare backend storage and active transfer streams.
          </p>
        </div>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:brightness-110 transition flex items-center gap-2"
        >
          <Zap className="w-4 h-4" /> New Transfer
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Total Transferred</span>
          <div className="text-2xl font-black text-white font-mono">
            {formatSize(stats.totalStorageBytes)}
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-brand-500 h-full w-[15%]" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Total Transfers Created</span>
          <div className="text-2xl font-black text-white font-mono">{stats.totalTransfers}</div>
          <p className="text-[10px] text-slate-400 font-semibold">Live Real-time Count</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Active Live Streams</span>
          <div className="text-2xl font-black text-cyan-400 font-mono">{stats.activeTransfers}</div>
          <p className="text-[10px] text-slate-400 font-semibold">Socket.IO Gateway</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Integrity Verification</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">SHA-256</div>
          <p className="text-[10px] text-emerald-400 font-semibold">100% Chunk Validation</p>
        </div>
      </div>

      {/* Live Transfers Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Live Transfer History
          </h3>
          <span className="text-xs text-slate-400">Auto-refreshing every 5s</span>
        </div>

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
                    Loading live transfers from backend...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No transfers created yet. Click <Link href="/" className="text-brand-400 underline font-semibold">New Transfer</Link> to send your first file!
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
