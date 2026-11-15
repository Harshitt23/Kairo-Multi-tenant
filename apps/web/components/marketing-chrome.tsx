'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './brand';
import { ThemeToggle } from './theme-toggle';

/* --------------------------------------------------------------------- */
/*  Shared marketing chrome — nav + footer used by the landing page and   */
/*  every standalone marketing page (docs, changelog, about, …).          */
/* --------------------------------------------------------------------- */

/** Primary/secondary link targets shared across the marketing surface. */
export const SIGN_UP_HREF = '/login?mode=register';
export const SIGN_IN_HREF = '/login';

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Product', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Docs', href: '/docs' },
];

export function MarketingNav() {
  return (
    <nav
      aria-label="Marketing"
      className="sticky top-0 z-50 border-b border-edge bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Kairo</span>
        </Link>
        <div className="hidden items-center gap-6 text-[13px] text-muted md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={SIGN_IN_HREF}
            className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            Log in
          </Link>
          <Link
            href={SIGN_UP_HREF}
            className="inline-flex h-8 items-center justify-center rounded-md bg-ink px-3.5 text-[13px] font-medium text-surface transition-colors hover:bg-ink/85"
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}

const FOOTER_COLUMNS: { heading: string; items: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    items: [
      { label: 'Boards', href: '/#features' },
      { label: 'Permissions', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    heading: 'Legal',
    items: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-edge bg-surface px-5 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="mb-3 flex items-center gap-2">
              <Logo size={22} />
              <span className="text-sm font-semibold text-ink">Kairo</span>
            </Link>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted">
              Workspaces, boards, and role-based access for teams that ship.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <FooterColumn key={col.heading} heading={col.heading} items={col.items} />
          ))}
        </div>
        <div className="mt-12 border-t border-edge pt-6 text-[12.5px] text-faint">
          © {new Date().getFullYear()} Kairo
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  items,
}: {
  heading: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
        {heading}
      </span>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="text-[13px] text-muted transition-colors hover:text-ink"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Page wrapper that frames standalone marketing pages with nav + footer. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

/** Consistent header for standalone marketing pages. */
export function MarketingPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-edge bg-surface px-5 py-14">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="mb-2 font-mono text-[12px] uppercase tracking-wider text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
    </section>
  );
}
