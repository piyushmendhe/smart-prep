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
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Flame, label: '🏠 Dashboard' },
  { href: '/dsa', icon: BookOpen, label: '🧩 DSA Track' },
  { href: '/system-design', icon: BarChart3, label: '🏗️ System Design' },
  { href: '/de-roadmap', icon: Database, label: '🗄️ DE Roadmap' },
  { href: '/cheatsheet', icon: BookMarked, label: '📋 Cheatsheet' },
  { href: '/behavioral', icon: MessageSquare, label: '🎯 Behavioral' },
  { href: '/progress-map', icon: Map, label: '🗺️ Progress Map' },
  { href: '/weekly-review', icon: CalendarDays, label: '📅 Weekly Review' },
  { href: '/sessions', icon: MessagesSquare, label: '💬 Sessions' },
  { href: '/profile', icon: User, label: '👤 Profile' },
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

  return (
    <motion.div
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-64 bg-card border-r border-neutral-800 flex flex-col p-6 gap-8 fixed h-screen overflow-y-auto z-20 left-0 top-0"
    >
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-lg text-foreground">SMART PREP</h1>
          <p className="text-xs text-muted">Interview Tracker</p>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#00d4ff1a] text-foreground border border-[#00d4ff66] font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-neutral-800 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        {/* Admin link — only visible to admin */}
        {user?.email === ADMIN_EMAIL && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === '/admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold'
                  : 'text-muted hover:text-foreground hover:bg-neutral-800 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">🛡️ Admin</span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* User Info & Logout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="border-t border-neutral-800 pt-4 space-y-3"
      >
        {user && (
          <>
            <div className="px-4 py-3 bg-neutral-900 rounded-lg">
              <p className="text-xs text-muted mb-1">Logged in as</p>
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-muted text-center py-4 border-t border-neutral-800"
      >
        <p>Build consistently</p>
        <p>Get interviews</p>
      </motion.div>
    </motion.div>
  );
}
