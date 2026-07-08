'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../lib/hooks';
import { cn } from '../lib/cn';
import { CreateOrgDialog } from './create-org-dialog';
import { CreateProjectDialog } from './create-project-dialog';

/** Sidebar (or anything else) can summon the palette without prop-drilling. */
export function openCommandPalette() {
  window.dispatchEvent(new Event('pm:open-palette'));
}

export const isMac =
  typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

type Group = 'Navigate' | 'Projects' | 'Actions';

interface Command {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
}

const GROUPS: Group[] = ['Navigate', 'Projects', 'Actions'];

export function CommandPalette({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const projects = useProjects(orgSlug);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    const onSummon = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pm:open-palette', onSummon);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pm:open-palette', onSummon);
    };
  }, []);

  const commands: Command[] = useMemo(
    () => [
      { id: 'nav-projects', group: 'Navigate', label: 'Projects', run: () => router.push(`/${orgSlug}`) },
      { id: 'nav-inbox', group: 'Navigate', label: 'Inbox', keywords: 'notifications', run: () => router.push(`/${orgSlug}/inbox`) },
      { id: 'nav-settings', group: 'Navigate', label: 'Settings', keywords: 'members notifications', run: () => router.push(`/${orgSlug}/settings`) },
      ...(projects.data ?? []).map<Command>((p) => ({
        id: p.id,
        group: 'Projects',
        label: p.name,
        hint: p.key,
        keywords: p.key,
        run: () => router.push(`/${orgSlug}/${p.key}/board`),
      })),
      { id: 'new-project', group: 'Actions', label: 'Create new project…', run: () => setCreatingProject(true) },
      { id: 'new-org', group: 'Actions', label: 'Create new organization…', run: () => setCreatingOrg(true) },
    ],
    [projects.data, orgSlug, router],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords ?? ''}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => setActiveIdx(0), [query, open]);
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function run(c: Command) {
    setOpen(false);
    c.run();
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault();
      run(filtered[activeIdx]);
    }
  }

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-[18vh] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-edge bg-panel shadow-card focus:outline-none"
          >
            <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command or search…"
              className="w-full border-b border-edge bg-transparent px-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            <div className="max-h-[50vh] overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-zinc-600">No results</p>
              )}
              {GROUPS.map((g) => {
                const items = filtered.filter((c) => c.group === g);
                if (items.length === 0) return null;
                return (
                  <div key={g} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                      {g}
                    </p>
                    {items.map((c) => {
                      const idx = filtered.indexOf(c);
                      return (
                        <button
                          key={c.id}
                          onClick={() => run(c)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors',
                            idx === activeIdx ? 'bg-elevated text-zinc-100' : 'text-zinc-400',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{c.label}</span>
                          {c.hint && (
                            <span className="shrink-0 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-indigo-300">
                              {c.hint}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 border-t border-edge px-4 py-2 text-[11px] text-zinc-600">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <CreateProjectDialog orgSlug={orgSlug} open={creatingProject} onOpenChange={setCreatingProject} />
      <CreateOrgDialog open={creatingOrg} onOpenChange={setCreatingOrg} />
    </>
  );
}
