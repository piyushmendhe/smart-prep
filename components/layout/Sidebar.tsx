'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  BookOpen,
  BookMarked,
  Database,
  MessageSquare,
  Flame,
  LogOut,
  Map,
  CalendarDays,
  MessagesSquare,
  User,
  ShieldCheck,
  Crown,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Flame, label: 'Dashboard', color: 'text-orange-400' },
  { href: '/dsa', icon: BookOpen, label: 'DSA Track', color: 'text-cyan-400' },
  { href: '/system-design', icon: BarChart3, label: 'System Design', color: 'text-purple-400' },
  { href: '/de-roadmap', icon: Database, label: 'DE Roadmap', color: 'text-emerald-400' },
  { href: '/cheatsheet', icon: BookMarked, label: 'Cheatsheet', color: 'text-yellow-400' },
  { href: '/behavioral', icon: MessageSquare, label: 'Behavioral', color: 'text-pink-400' },
  { href: '/progress-map', icon: Map, label: 'Progress Map', color: 'text-blue-400' },
  { href: '/weekly-review', icon: CalendarDays, label: 'Weekly Review', color: 'text-indigo-400' },
  { href: '/sessions', icon: MessagesSquare, label: 'Sessions', color: 'text-teal-400' },
  { href: '/profile', icon: User, label: 'Profile', color: 'text-slate-400' },
  { href: '/pricing', icon: Crown, label: 'Pricing', color: 'text-amber-400' },
];

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <motion.div
      initial={{ x: -264 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 flex flex-col fixed h-screen overflow-y-auto z-20 left-0 top-0"
      style={{
        background: 'linear-gradient(180deg, #08080f 0%, #0a0a16 50%, #070710 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top gradient accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      {/* Logo Section */}
      <div className="px-5 pt-6 pb-4">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 blur-sm -z-10" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-base tracking-wider text-white">SMART PREP</h1>
            <p className="text-[10px] text-muted tracking-widest uppercase font-medium">Interview OS</p>
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent mb-3" />

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1 px-3">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-accent/8 border-l-2 border-accent text-white shadow-[inset_0_0_20px_rgba(0,212,255,0.04)]'
                    : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/4 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                    isActive ? item.color : 'text-neutral-600 group-hover:text-neutral-400'
                  }`}
                />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                    style={{ boxShadow: '0 0 6px rgba(0,212,255,0.8)' }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* Admin link */}
        {ADMIN_EMAIL && user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/admin"
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${pathname === '/admin'
                  ? 'bg-purple-500/10 border-l-2 border-purple-400 text-purple-300'
                  : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/4 border-l-2 border-transparent'
                }
              `}
            >
              <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${pathname === '/admin' ? 'text-purple-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
              <span className="text-sm font-medium">Admin</span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* User Section */}
      <div className="px-3 pb-4 pt-3">
        <div className="h-px bg-gradient-to-r from-transparent via-neutral-700/40 to-transparent mb-3" />
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            {/* User card */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/30 to-purple-500/30 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-accent">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-200 truncate">{user.name || 'User'}</p>
                <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

