import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { type DashboardStyles } from '../../lib/dashboard-theme';

/** Panel wrapper shared by every Home dashboard widget — applies the tweakable elevation theme. */
export function DashboardCard({
  theme,
  className,
  children,
}: {
  theme: DashboardStyles;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={theme.panelStyle}
      className={cn('rounded-2xl bg-panel p-5', theme.panelBorderClass, className)}
    >
      {children}
    </div>
  );
}
