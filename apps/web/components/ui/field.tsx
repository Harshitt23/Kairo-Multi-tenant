import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Labeled form field with optional hint and validation error.
 * The <label> wraps the control, so the association is implicit — any input
 * primitive works without id plumbing.
 */
export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="block text-[13px] font-medium text-zinc-300">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs text-red-400">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs text-zinc-600">{hint}</span>
      ) : null}
    </label>
  );
}
