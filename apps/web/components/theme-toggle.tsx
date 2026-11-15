'use client';

import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem('kairo-theme', dark ? 'dark' : 'light');
  } catch {
    /* private mode — preference just won't persist */
  }
}

/**
 * Light/dark switch. The saved preference is applied before paint by the
 * inline script in app/layout.tsx; this component only reflects + updates it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Render nothing until mounted so SSR output can't disagree with the class
  // the inline theme script already set.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  if (dark === null) return <span className={cn('h-8 w-8', className)} />;

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      onClick={() => {
        applyTheme(!dark);
        setDark(!dark);
      }}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink',
        className,
      )}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
