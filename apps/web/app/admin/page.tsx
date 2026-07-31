'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, HardDrive, Activity, Ban, Key } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransfers: 0,
    activeTransfers: 0,
    totalStorageBytes: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const statsRes = await fetch('/api/v1/admin/stats').catch(() => null);
      if (statsRes && statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const usersRes = await fetch('/api/v1/admin/users').catch(() => null);
      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error('Failed to load live admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-7 h-7 text-rose-400" /> Real-Time Admin Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor system metrics, registered users, Cloudflare R2 storage usage, and active Socket nodes.
        </p>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-400" /> Total Users
          </span>
          <div className="text-3xl font-black text-white font-mono">{stats.totalUsers}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-cyan-400" /> Cloud Storage
          </span>
          <div className="text-3xl font-black text-cyan-400 font-mono">{formatSize(stats.totalStorageBytes)}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Socket Streams
          </span>
          <div className="text-3xl font-black text-emerald-400 font-mono">{stats.activeTransfers}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" /> Total Transfers
          </span>
          <div className="text-3xl font-black text-indigo-400 font-mono">{stats.totalTransfers}</div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 className="text-lg font-bold text-white">Live User Registry</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-400 bg-slate-900/60 border-b border-white/10">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Storage Used</th>
                <th className="p-4">Verified</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                    Loading registered users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-sm">
                    No registered users yet. User activity will appear here in real-time.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-4 font-semibold text-white">{u.email}</td>
                    <td className="p-4 font-mono text-xs">{u.role}</td>
                    <td className="p-4 font-mono text-xs">{formatSize(u.storage_used_bytes)}</td>
                    <td className="p-4 text-xs text-emerald-400">Yes</td>
                    <td className="p-4 flex gap-2">
                      <button className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/30">
                        Ban
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
