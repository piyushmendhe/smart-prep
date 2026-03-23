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
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="app-header sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
    >
      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none" />

      <div>
        <h2 className="font-heading font-semibold text-lg text-foreground/90">
          {currentDate}
        </h2>
        <p className="text-xs text-muted tracking-wide">Build with purpose, ship consistently</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={toggle}
          className="w-9 h-9 rounded-lg border border-neutral-700/60 flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        {/* Streak Counter */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-default overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(245,158,11,0.08))',
            border: '1px solid rgba(249,115,22,0.25)',
            boxShadow: '0 0 20px rgba(249,115,22,0.08)',
          }}
          title={`Best streak: ${data.streak.longest} days`}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            className="flex-shrink-0"
          >
            <Flame className="w-5 h-5 text-orange-400" fill="currentColor" />
          </motion.div>

          <div className="leading-none">
            <motion.span
              key={data.streak.current}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="text-xl font-bold text-orange-300 block"
            >
              {data.streak.current}
            </motion.span>
            <span className="text-[9px] text-orange-400/60 font-semibold tracking-widest uppercase">
              day streak
            </span>
          </div>

          {data.streak.longest > 0 && (
            <div className="pl-3 border-l border-orange-500/20">
              <p className="text-[9px] text-orange-400/40 font-medium uppercase tracking-wide">Best</p>
              <p className="text-sm font-bold text-orange-300/50">{data.streak.longest}</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}

