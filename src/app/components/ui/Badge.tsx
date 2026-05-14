import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variants = {
    default:     'bg-secondary text-secondary-foreground',
    primary:     'bg-primary/10 text-primary border border-primary/20',
    success:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accent:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    outline:     'border border-border text-foreground bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
