import type { Metadata } from 'next';
import { Avatar } from '../../components/brand';
import {
  MarketingPageHeader,
  MarketingShell,
} from '../../components/marketing-chrome';

export const metadata: Metadata = {
  title: 'Blog — Kairo',
  description: 'Notes on shipping, team process, and building calm software.',
};

const POSTS = [
  {
    title: 'How we built live presence without melting our servers',
    excerpt:
      'A look at the CRDT-lite approach behind real-time cursors, and the trade-offs we made to keep it cheap at scale.',
    author: 'Priya Nair',
    seed: 'priya',
    date: 'July 2, 2026',
    tag: 'Engineering',
    featured: true,
  },
  {
    title: 'The case for no-meeting Wednesdays',
    excerpt: 'Six months in, here is what protecting a full day of focus did to our throughput.',
    author: 'Jordan Lee',
    seed: 'jl',
    date: 'June 18, 2026',
    tag: 'Culture',
  },
  {
    title: 'Designing a permission model people actually understand',
    excerpt: 'Roles are easy to add and hard to remove. How we kept RBAC legible.',
    author: 'Sam Ortiz',
    seed: 'sam',
    date: 'May 29, 2026',
    tag: 'Design',
  },
  {
    title: 'Migrating 40 engineers off Jira in a week',
    excerpt: 'A field report from a customer migration, and what our importer had to get right.',
    author: 'Priya Nair',
    seed: 'priya',
    date: 'May 9, 2026',
    tag: 'Customers',
  },
];

export default function BlogPage() {
  const [featured, ...rest] = POSTS;
  return (
    <MarketingShell>
      <MarketingPageHeader
        eyebrow="Blog"
        title="Notes from the team"
        description="Thoughts on shipping, process, and building calm software — straight from the people making Kairo."
      />
      <section className="px-6 py-16 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <article className="mb-10 overflow-hidden rounded-2xl border border-edge bg-panel shadow-card">
            <div className="grid gap-0 sm:grid-cols-2">
              <div className="aspect-[16/10] bg-brand sm:aspect-auto" />
              <div className="flex flex-col justify-center p-8">
                <span className="mb-3 w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  {featured.tag}
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                  {featured.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{featured.excerpt}</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <Avatar name={featured.author} seed={featured.seed} size={28} />
                  <span className="text-[13px] text-zinc-600">{featured.author}</span>
                  <span className="text-[13px] text-zinc-400">· {featured.date}</span>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <article
                key={p.title}
                className="flex flex-col rounded-2xl border border-edge bg-panel p-6 shadow-card"
              >
                <span className="mb-3 w-fit rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  {p.tag}
                </span>
                <h3 className="text-base font-semibold text-zinc-900">{p.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-zinc-500">{p.excerpt}</p>
                <div className="mt-5 flex items-center gap-2.5">
                  <Avatar name={p.author} seed={p.seed} size={24} />
                  <span className="text-[13px] text-zinc-600">{p.author}</span>
                  <span className="text-[13px] text-zinc-400">· {p.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
