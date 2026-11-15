import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
  {
    variants: {
      variant: {
        default: 'bg-elevated text-muted',
        brand: 'bg-accent/10 text-accent',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'bg-red-500/10 text-red-700 dark:text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  variant,
  className,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
