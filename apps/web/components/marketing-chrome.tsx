import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './brand';

/* --------------------------------------------------------------------- */
/*  Shared marketing chrome — nav + footer used by the landing page and   */
/*  every standalone marketing page (docs, changelog, about, …).          */
/*  Kept free of client hooks so it renders in both server and client     */
/*  ('use client') pages.                                                  */
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
      className="flex items-center justify-between border-b border-edge bg-panel px-6 py-5 lg:px-14"
    >
      <Link href="/" className="flex items-center gap-2.5">
        <Logo size={28} />
        <span className="text-[17px] font-bold tracking-tight text-zinc-900">PM SaaS</span>
      </Link>
      <div className="hidden items-center gap-9 text-sm font-medium text-zinc-600 md:flex">
        {NAV_LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="transition-colors hover:text-zinc-900">
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-5">
        <Link
          href={SIGN_IN_HREF}
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          Log in
        </Link>
        <Link
          href={SIGN_UP_HREF}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-brand px-3 text-[13px] font-medium text-white shadow-glow transition-opacity hover:opacity-90"
        >
          Start free
        </Link>
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
    <footer className="bg-zinc-900 px-6 py-14 lg:px-14">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="mb-3.5 flex items-center gap-2.5">
            <Logo size={24} />
            <span className="text-base font-bold text-white">PM SaaS</span>
          </Link>
          <p className="max-w-xs text-[13.5px] leading-relaxed text-zinc-400">
            The calm, real-time project tracker for teams who ship.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <FooterColumn key={col.heading} heading={col.heading} items={col.items} />
        ))}
      </div>
      <div className="mt-12 border-t border-zinc-800 pt-6 text-[13px] text-zinc-500">
        © {new Date().getFullYear()} PM SaaS, Inc. All rights reserved.
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
    <div className="flex flex-col gap-3">
      <span className="mb-1.5 text-[12.5px] font-bold uppercase tracking-wide text-zinc-500">
        {heading}
      </span>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="text-sm text-zinc-300 transition-colors hover:text-white"
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

/** Consistent hero header for standalone marketing pages. */
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
    <section className="border-b border-edge bg-panel px-6 py-16 lg:px-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-zinc-600">{description}</p>
        )}
      </div>
    </section>
  );
}
