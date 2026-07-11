import type { Metadata } from 'next';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Privacy Policy — PM SaaS',
  description: 'How PM SaaS collects, uses, and protects your data.',
};

const SECTIONS = [
  {
    heading: 'Overview',
    body: 'This policy explains what information PM SaaS collects, how we use it, and the choices you have. We collect the minimum needed to run the product and never sell your data. This page is a product demo and is illustrative rather than legal advice.',
  },
  {
    heading: 'Information we collect',
    body: 'Account details you provide (name, email, workspace names), content you create (issues, comments, boards), and limited technical data (log and device information) needed to operate and secure the service.',
  },
  {
    heading: 'How we use information',
    body: 'To provide and improve the service, authenticate you, send essential product notifications, and protect against abuse. We process data on the basis of contract, legitimate interest, and your consent where required.',
  },
  {
    heading: 'Data sharing',
    body: 'We share data only with subprocessors that help us run the service (hosting, email, payments) under contractual safeguards, or when required by law. We do not sell personal data.',
  },
  {
    heading: 'Your rights',
    body: 'You can access, export, correct, or delete your data from workspace settings or by contacting us. Workspace owners control membership and can remove members and their access at any time.',
  },
  {
    heading: 'Retention',
    body: 'We retain data for as long as your workspace is active, and delete or anonymize it within a reasonable period after account closure, unless a longer period is required by law.',
  },
  {
    heading: 'Contact',
    body: 'Questions about privacy? Reach us at privacy@pmsaas.example.',
  },
];

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader eyebrow="Legal" title="Privacy Policy" />
      <section className="px-6 py-14 lg:px-14 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-10 text-[13px] text-zinc-400">Last updated: July 1, 2026</p>
          <div className="flex flex-col gap-9">
            {SECTIONS.map((s) => (
              <div key={s.heading}>
                <h2 className="mb-2 text-lg font-semibold text-zinc-900">{s.heading}</h2>
                <p className="text-[15px] leading-relaxed text-zinc-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
