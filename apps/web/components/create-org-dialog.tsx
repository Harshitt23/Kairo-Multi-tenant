'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { createOrgSchema } from '@pm/types';
import { ApiError } from '../lib/api';
import { useCreateOrg } from '../lib/hooks';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Field } from './ui/field';

/** "Acme Inc." -> "acme-inc" */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

type FieldErrors = Partial<Record<'name' | 'slug', string>>;

export function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateOrg();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function reset() {
    setName('');
    setSlug('');
    setSlugTouched(false);
    setErrors({});
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createOrgSchema.safeParse({ name: name.trim(), slug });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (org) => {
        toast.success(`Organization “${org.name}” created`);
        onOpenChange(false);
        reset();
        router.push(`/${org.slug}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 400) {
          setErrors({ slug: err.message });
        } else {
          toast.error(err instanceof ApiError ? err.message : 'Failed to create organization');
        }
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (onOpenChange(o), !o && reset())}>
      <DialogContent
        title="New organization"
        description="A workspace for your team, projects and issues."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name" error={errors.name}>
            <Input
              autoFocus
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <Field
            label="URL slug"
            error={errors.slug}
            hint={slug ? `Your workspace will live at /${slug}` : 'Lowercase letters, numbers and dashes'}
          >
            <Input
              placeholder="acme-inc"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
