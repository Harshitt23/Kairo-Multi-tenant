import { type ReactNode } from 'react';

/** App logo: a flat ink tile with a stacked-board glyph. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md bg-ink text-surface"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="10" rx="1.5" fill="currentColor" fillOpacity="0.95" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" fill="currentColor" fillOpacity="0.55" />
        <rect x="14" y="3" width="7" height="6" rx="1.5" fill="currentColor" fillOpacity="0.55" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" fill="currentColor" fillOpacity="0.95" />
      </svg>
    </span>
  );
}

/** Wordmark: logo + product name. */
export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-[15px] font-semibold tracking-tight text-ink">Kairo</span>
    </span>
  );
}

// Flat, slightly desaturated fills — enough to tell people apart, quiet
// enough to not fight the UI.
const AVATAR_COLORS = [
  '#4f6bcd',
  '#3f8f8a',
  '#8a6ccd',
  '#b06a3f',
  '#a84f6e',
  '#5f8f4f',
];

function hashIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** Initials avatar with a deterministic flat color derived from the seed. */
export function Avatar({
  name,
  seed,
  size = 28,
}: {
  name: string;
  seed?: string;
  size?: number;
}) {
  const initials =
    name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  const color = AVATAR_COLORS[hashIndex(seed ?? name, AVATAR_COLORS.length)];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color }}
      title={name}
    >
      {initials}
    </span>
  );
}

/** A flat bordered card wrapper used across list/detail surfaces. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-edge bg-panel transition-colors ${className}`}>
      {children}
    </div>
  );
}
