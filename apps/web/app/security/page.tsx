import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Security — Kairo',
  description: 'How Kairo keeps your workspace and data secure.',
};

const PRACTICES = [
  {
    title: 'Encryption in transit & at rest',
    body: 'All traffic is served over TLS 1.2+, and data is encrypted at rest with AES-256.',
  },
  {
    title: 'Isolated multi-tenancy',
    body: 'Every request is scoped to your workspace. Authorization is enforced on the server for each org, project, and issue.',
  },
  {
    title: 'Role-based access control',
    body: 'Workspace, project, and guest roles let you grant exactly the access each person needs — and revoke it instantly.',
  },
  {
    title: 'Least-privilege infrastructure',
    body: 'Production access is limited, audited, and protected by SSO and hardware-backed MFA.',
  },
  {
    title: 'Continuous backups',
    body: 'Encrypted, point-in-time backups with regular restore testing keep your data recoverable.',
  },
  {
    title: 'Responsible disclosure',
    body: 'We welcome reports from security researchers and respond quickly to verified issues.',
  },
];

const COMPLIANCE = ['SOC 2 Type II', 'GDPR', 'ISO 27001', 'SAML SSO', 'SCIM', 'Audit logs'];

export default function SecurityPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Security"
        title="Security you can build on"
        description="Security isn't a feature we bolt on — it's how the product is built. Here's how we protect your workspace and data."
      />

      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map((p) => (
              <div key={p.title}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2}>
                    <rect x="4" y="11" width="16" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-900">{p.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-edge bg-panel px-6 py-14 text-center lg:px-14">
        <p className="mb-6 text-[12.5px] font-semibold uppercase tracking-wide text-zinc-400">
          Compliance & controls
        </p>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {COMPLIANCE.map((c) => (
            <span
              key={c}
              className="rounded-full border border-edge bg-surface px-4 py-1.5 text-[13px] font-medium text-zinc-700"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 text-center lg:px-14">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Found a vulnerability?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          We appreciate responsible disclosure. Reach our security team directly.
        </p>
        <Link
          href="mailto:security@kairo.example?subject=Security%20report"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90"
        >
          Contact security
        </Link>
      </section>
    </MarketingShell>
  );
}
