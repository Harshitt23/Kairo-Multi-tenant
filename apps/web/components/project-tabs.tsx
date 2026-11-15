'use client';

import Link from 'next/link';
import { cn } from '../lib/cn';

/** Board / List view switcher shown in the project header. */
export function ProjectTabs({
  orgSlug,
  projectKey,
  active,
}: {
  orgSlug: string;
  projectKey: string;
  active: 'board' | 'list';
}) {
  const tabs = [
    { key: 'board' as const, label: 'Board', icon: <IconBoard /> },
    { key: 'list' as const, label: 'List', icon: <IconList /> },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-elevated p-0.5">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`/${orgSlug}/${projectKey}/${t.key}`}
          aria-current={active === t.key ? 'page' : undefined}
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium transition-colors',
            active === t.key
              ? 'bg-panel text-ink shadow-card'
              : 'text-muted hover:text-ink',
          )}
        >
          {t.icon}
          {t.label}
        </Link>
      ))}
    </div>
  );
}

const ic = {
  width: 13,
  height: 13,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function IconBoard() {
  return (
    <svg {...ic}>
      <rect x="3" y="4" width="7" height="16" rx="1.5" />
      <rect x="14" y="4" width="7" height="9" rx="1.5" />
    </svg>
  );
}

function IconList() {
  return (
    <svg {...ic}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth="2.4" />
    </svg>
  );
}
