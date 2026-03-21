'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Users, Mail, Clock, Shield, RefreshCw, LogIn } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ProviderBadge({ provider }: { provider: string }) {
  const isGoogle = provider === 'google';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      isGoogle
        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
        : 'bg-neutral-700/60 text-neutral-300 border border-neutral-600/40'
    }`}>
      {isGoogle ? (
        <svg className="w-3 h-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <Mail className="w-3 h-3" />
      )}
      {isGoogle ? 'Google' : 'Email'}
    </span>
  );
}

export default function AdminPage() {
  const { user, isLoaded } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to fetch');
      }
      const body = await res.json();
      setUsers(body.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/login'); return; }
    if (user.email !== ADMIN_EMAIL) { router.push('/'); return; }
    fetchUsers();
  }, [isLoaded, user, router, fetchUsers]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading users…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchUsers} className="text-sm text-accent hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const googleUsers = users.filter(u => u.provider === 'google').length;
  const emailUsers = users.filter(u => u.provider === 'email').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted">User management & analytics</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sm text-muted hover:text-foreground transition-all border border-neutral-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'from-cyan-500 to-blue-600' },
          { label: 'Google Sign-In', value: googleUsers, icon: LogIn, color: 'from-blue-500 to-indigo-600' },
          { label: 'Email Sign-In', value: emailUsers, icon: Mail, color: 'from-violet-500 to-purple-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-neutral-800 rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-neutral-800 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted" />
          <h2 className="font-semibold text-foreground">All Users</h2>
          <span className="ml-auto text-xs text-muted bg-neutral-800 px-2 py-0.5 rounded-full">{users.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-muted text-xs uppercase tracking-wider">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Provider</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="border-b border-neutral-800/60 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-muted">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{u.email}</td>
                    <td className="px-6 py-4 text-muted">{u.name}</td>
                    <td className="px-6 py-4"><ProviderBadge provider={u.provider} /></td>
                    <td className="px-6 py-4 text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {fmt(u.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted">{fmt(u.last_sign_in_at)}</td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
