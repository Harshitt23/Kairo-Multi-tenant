'use client';

import { useState } from 'react';
import { useCreateLabel, useLabels } from '../lib/hooks';
import { cn } from '../lib/cn';

const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'];

/**
 * Toggle-chip label selector with inline creation. Works uncontrolled-ish:
 * the parent owns the selected id array and gets notified on every change.
 */
export function LabelPicker({
  orgSlug,
  selected,
  onChange,
}: {
  orgSlug: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: labels = [] } = useLabels(orgSlug);
  const create = useCreateLabel(orgSlug);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const add = () => {
    const n = name.trim();
    if (!n || create.isPending) return;
    create.mutate(
      { name: n, color },
      {
        onSuccess: (label) => {
          onChange([...selected, label.id]);
          setName('');
        },
      },
    );
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Labels
      </span>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((l) => {
          const on = selected.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle(l.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                on
                  ? 'border-transparent text-white'
                  : 'border-edge bg-panel text-zinc-600 hover:border-zinc-300',
              )}
              style={on ? { backgroundColor: l.color } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: on ? 'rgba(255,255,255,0.9)' : l.color }}
              />
              {l.name}
            </button>
          );
        })}
        {labels.length === 0 && (
          <span className="text-xs text-zinc-500">No labels yet — create one below.</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex items-center gap-1">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn('h-4 w-4 rounded-full', color === c && 'ring-2 ring-zinc-400 ring-offset-1')}
              style={{ backgroundColor: c }}
              aria-label={`Use color ${c}`}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New label…"
          className="h-7 flex-1 rounded-md border border-edge bg-surface px-2 text-xs text-zinc-900 outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={!name.trim() || create.isPending}
          className="h-7 rounded-md bg-indigo-600 px-2.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
