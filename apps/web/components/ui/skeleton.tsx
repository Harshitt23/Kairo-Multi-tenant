import { cn } from '../../lib/cn';

/** Flat loading placeholder with a quiet sweep; plain block under reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-elevated', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-panel/60 to-transparent motion-reduce:hidden" />
    </div>
  );
}
