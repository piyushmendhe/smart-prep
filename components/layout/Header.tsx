'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@/hooks/useProgress';
import { useTheme } from '@/lib/theme';
import { Flame, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const { data, isLoaded } = useProgress();
  const { theme, toggle } = useTheme();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  if (!isLoaded) return null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border-b border-neutral-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10"
    >
      <div>
        <h2 className="text-foreground font-heading font-semibold text-xl">
          {currentDate}
        </h2>
        <p className="text-muted text-sm">
          Build with purpose
        </p>
      </div>

      <div className="flex items-center gap-3">
      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="w-9 h-9 rounded-lg border border-neutral-700 flex items-center justify-center text-muted hover:text-foreground hover:border-accent transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </motion.button>

      {/* Streak Counter */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="relative flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 px-4 py-2.5 rounded-xl cursor-default overflow-hidden"
        title={`Best streak: ${data.streak.longest} days`}
      >
        {/* background glow */}
        <div className="absolute inset-0 bg-orange-500/5 blur-md pointer-events-none" />

        <motion.div
          animate={{ scale: [1, 1.18, 1], rotate: [-6, 6, -3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3 }}
          className="relative z-10 flex-shrink-0"
        >
          <Flame className="w-6 h-6 text-orange-400" fill="currentColor" />
        </motion.div>

        <div className="relative z-10 leading-none">
          <motion.span
            key={data.streak.current}
            initial={{ opacity: 0, scale: 0.6, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="text-2xl font-bold text-orange-300 block"
          >
            {data.streak.current}
          </motion.span>
          <span className="text-[10px] text-orange-400/70 font-semibold tracking-widest uppercase">
            day streak
          </span>
        </div>

        {data.streak.longest > 0 && (
          <div className="relative z-10 pl-3 border-l border-orange-500/25">
            <p className="text-[9px] text-orange-400/50 font-medium uppercase tracking-wide leading-tight">Best</p>
            <p className="text-base font-bold text-orange-300/60 leading-tight">{data.streak.longest}</p>
          </div>
        )}
      </motion.div>
      </div>
    </motion.header>
  );
}
