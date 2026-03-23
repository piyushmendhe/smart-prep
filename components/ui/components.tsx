'use client';

import { motion } from 'framer-motion';
import { ReactNode, useId } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  icon?: ReactNode;
}

export function ProgressRing({ value, max, label, icon }: ProgressRingProps) {
  const uid = useId().replace(/:/g, '');
  const gradientId = `ring-grad-${uid}`;
  const glowId = `ring-glow-${uid}`;

  const percentage = max > 0 ? (value / max) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Outer glow halo */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth="14" />
          {/* Track */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#1c1c2e" strokeWidth="8" />
          {/* Progress arc */}
          <motion.circle
            cx="60" cy="60" r="45"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            strokeLinecap="round"
            filter={`url(#${glowId})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="mb-1">{icon}</div>}
          <motion.div
            key={value}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="text-2xl font-bold text-accent"
          >
            {value}
          </motion.div>
          <span className="text-xs text-muted">/ {max}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground/80 text-center">{label}</p>
    </motion.div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function PageContainer({ children, title, description }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 max-w-7xl mx-auto w-full"
    >
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl mb-2 gradient-text">{title}</h1>
        {description && (
          <p className="text-muted text-lg leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GlassCard({
  children,
  className = '',
  onClick,
  hoverable = false,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.015, y: -2 } : {}}
      onClick={onClick}
      className={`
        relative bg-gradient-to-br from-neutral-900/90 to-neutral-950/70
        backdrop-blur-xl rounded-xl p-6
        border border-neutral-700/40
        shadow-lg
        transition-all duration-300
        ${hoverable
          ? 'cursor-pointer hover:border-accent/25 hover:shadow-[0_8px_32px_rgba(0,212,255,0.07)] hover:from-neutral-900 hover:to-neutral-900/90'
          : ''
        }
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const styles = {
    Easy: 'bg-success/10 text-success border border-success/30',
    Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
    Hard: 'bg-secondary/10 text-secondary border border-secondary/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
}
