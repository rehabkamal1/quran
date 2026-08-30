import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  color?: 'primary' | 'secondary';
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className, 
  color = 'primary',
  height = 'md'
}) => {
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary'
  };

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden", heights[height], className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${safeProgress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={cn("h-full rounded-full", colors[color])}
      />
    </div>
  );
};

