import { type ReactNode } from 'react';

/** App logo: a gradient tile with a stacked-board glyph. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-brand text-white shadow-glow"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="10" rx="1.5" fill="white" fillOpacity="0.95" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
        <rect x="14" y="3" width="7" height="6" rx="1.5" fill="white" fillOpacity="0.6" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" fill="white" fillOpacity="0.95" />
      </svg>
    </span>
  );
}

/** Wordmark: logo + product name. */
export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-[15px] font-semibold tracking-tight text-zinc-900">Kairo</span>
    </span>
  );
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
];

function hashIndex(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** Initials avatar with a deterministic gradient derived from the seed. */
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
  const grad = AVATAR_GRADIENTS[hashIndex(seed ?? name, AVATAR_GRADIENTS.length)];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} font-medium text-white`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials}
    </span>
  );
}

/** A subtle card wrapper used across list/detail surfaces. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-edge bg-panel shadow-card transition-colors ${className}`}
    >
      {children}
    </div>
  );
}
