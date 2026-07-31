'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-neon-purple text-white mx-auto flex items-center justify-center font-bold text-xl shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Transora Account</h2>
          <p className="text-xs text-slate-400">Unlock 100 GB cloud storage and unlimited LAN transfers.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400">Full Name</label>
            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-white/10 mt-1">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-transparent text-sm text-slate-200 outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-white/10 mt-1">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm text-slate-200 outline-none w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-white/10 mt-1">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm text-slate-200 outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-neon-purple text-white font-bold text-sm hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-white/10">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
