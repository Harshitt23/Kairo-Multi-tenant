import type { Metadata } from 'next';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Terms of Service — PM SaaS',
  description: 'The terms that govern your use of PM SaaS.',
};

const SECTIONS = [
  {
    heading: '1. Agreement',
    body: 'By accessing or using PM SaaS, you agree to these terms. If you use the service on behalf of an organization, you agree on its behalf. This page is a product demo and is illustrative rather than a binding contract.',
  },
  {
    heading: '2. Your account',
    body: 'You are responsible for activity under your account and for keeping your credentials secure. Workspace owners are responsible for managing members and their permissions.',
  },
  {
    heading: '3. Acceptable use',
    body: 'Do not misuse the service: no unlawful content, no attempts to disrupt or reverse-engineer the platform, and no infringing on the rights of others. We may suspend accounts that violate these terms.',
  },
  {
    heading: '4. Plans & billing',
    body: 'Paid plans are billed per seat and/or usage as described on the pricing page. Charges are non-refundable except where required by law. You can upgrade, downgrade, or cancel at any time from workspace settings.',
  },
  {
    heading: '5. Your content',
    body: 'You retain ownership of the content you create. You grant us the limited rights needed to host and operate the service. You can export or delete your content at any time.',
  },
  {
    heading: '6. Warranty & liability',
    body: 'The service is provided “as is.” To the extent permitted by law, we disclaim implied warranties and limit our liability for indirect or consequential damages.',
  },
  {
    heading: '7. Changes',
    body: 'We may update these terms as the product evolves. We will give reasonable notice of material changes. Continued use after changes take effect constitutes acceptance.',
  },
];

export default function TermsPage() {
  return (
    <MarketingShell>
      <MarketingPageHeader eyebrow="Legal" title="Terms of Service" />
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
