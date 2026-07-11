import { cn } from '../../lib/cn';

/**
 * Loading placeholder with a light sweeping sheen (feels more premium than a
 * flat pulse). Respects reduced-motion by falling back to a subtle pulse.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-elevated', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden" />
    </div>
  );
}
