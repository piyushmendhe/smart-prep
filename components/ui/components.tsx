'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  icon?: ReactNode;
}

export function ProgressRing({ value, max, label, icon }: ProgressRingProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-3"
    >
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#212129"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="mb-1">{icon}</div>}
          <motion.div
            key={value}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-accent"
          >
            {value}
          </motion.div>
          <span className="text-xs text-muted">/ {max}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground text-center">{label}</p>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-8 max-w-7xl mx-auto w-full"
    >
      <div className="mb-8">
        <h1 className="font-heading font-bold text-4xl text-foreground mb-2">{title}</h1>
        {description && <p className="text-muted text-lg">{description}</p>}
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
      whileHover={hoverable ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`bg-card/40 backdrop-blur-md border border-neutral-700 border-neutral-700/50 rounded-xl p-6 transition-all ${
        hoverable ? 'cursor-pointer hover:border-accent border-opacity-30 hover:border-opacity-100' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const colorMap = {
    Easy: 'bg-success/20 text-success',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Hard: 'bg-secondary/20 text-secondary',
  };

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorMap[difficulty]}`}>
      {difficulty}
    </span>
  );
}
