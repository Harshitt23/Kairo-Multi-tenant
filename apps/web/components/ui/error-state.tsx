import { cn } from '../../lib/cn';
import { Button } from './button';

/** Friendly failure panel with a retry action — used wherever a query errors. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this. Check your connection and try again.',
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 bg-red-500/[0.03] px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-3 text-red-400/70">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4.5M12 15.5v.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
