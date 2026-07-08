'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { createProjectSchema } from '@pm/types';
import { ApiError } from '../lib/api';
import { useCreateProject } from '../lib/hooks';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input, Textarea } from './ui/input';
import { Field } from './ui/field';

/** "Mobile App" -> "MOBILE" -> caller trims to 8; initials for multi-word. */
function suggestKey(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ''));
  if (words.length === 0) return '';
  const raw =
    words.length === 1 ? words[0].slice(0, 4) : words.map((w) => w[0] ?? '').join('').slice(0, 8);
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

type FieldErrors = Partial<Record<'name' | 'key' | 'description', string>>;

export function CreateProjectDialog({
  orgSlug,
  open,
  onOpenChange,
}: {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateProject(orgSlug);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function reset() {
    setName('');
    setKey('');
    setKeyTouched(false);
    setDescription('');
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createProjectSchema.safeParse({
      name: name.trim(),
      key,
      description: description.trim() || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FieldErrors;
        fieldErrors[k] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (project) => {
        toast.success(`Project “${project.name}” created`);
        onOpenChange(false);
        reset();
        router.push(`/${orgSlug}/${project.key}/board`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          setErrors({ key: err.message });
        } else {
          toast.error(err instanceof ApiError ? err.message : 'Failed to create project');
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), !o && reset())}>
      <DialogContent
        title="New project"
        description="Projects group issues on a board. The key prefixes issue numbers."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" error={errors.name}>
            <Input
              autoFocus
              placeholder="Mobile App"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!keyTouched) setKey(suggestKey(e.target.value));
              }}
            />
          </Field>
          <Field
            label="Key"
            error={errors.key}
            hint={key ? `Short identifier shown across the app (e.g. ${key})` : '2–8 uppercase letters or numbers'}
          >
            <Input
              placeholder="APP"
              value={key}
              maxLength={8}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              }}
            />
          </Field>
          <Field label="Description" error={errors.description} hint="Optional">
            <Textarea
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
