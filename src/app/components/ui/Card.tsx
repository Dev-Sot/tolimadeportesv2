import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import type { KeyboardEvent, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-checked'?: boolean;
  'aria-selected'?: boolean;
  'aria-label'?: string;
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
  role,
  'aria-checked': ariaChecked,
  'aria-selected': ariaSelected,
  'aria-label': ariaLabel,
}: CardProps) {
  const isInteractive = hover || !!onClick;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  }

  const Component = isInteractive ? motion.div : 'div';

  return (
    <Component
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={role ?? (onClick ? 'button' : undefined)}
      aria-checked={ariaChecked}
      aria-selected={ariaSelected}
      aria-label={ariaLabel}
      whileHover={isInteractive ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-card border border-border rounded-xl p-6 shadow-sm',
        isInteractive && 'cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-semibold text-card-foreground', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-muted-foreground', className)}>
      {children}
    </div>
  );
}
