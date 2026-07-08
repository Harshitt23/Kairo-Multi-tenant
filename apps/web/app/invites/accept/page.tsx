'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { useAcceptInvite } from '../../../lib/hooks';
import { Logo } from '../../../components/brand';
import { Spinner } from '../../../components/ui/spinner';

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <AcceptInvite />
    </Suspense>
  );
}

function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const authToken = useAuthStore((s) => s.accessToken);
  const { mutateAsync } = useAcceptInvite();
  const attempted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Driven off the mutateAsync promise directly (not the mutation's own
  // onSuccess/onError options) — those get orphaned by React StrictMode's
  // double-invoke of this effect in dev, since the observer that issued the
  // request isn't the one still mounted when it resolves.
  useEffect(() => {
    if (!token || !authToken || attempted.current) return;
    attempted.current = true;
    mutateAsync(token)
      .then((res) => router.replace(`/${res.organization.slug}`))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Something went wrong.'),
      );
  }, [token, authToken, mutateAsync, router]);

  if (!token) {
    return (
      <StatusCard
        title="Invalid invite link"
        description="This link is missing its invite token. Ask whoever invited you to resend it."
      />
    );
  }

  if (!authToken) {
    return (
      <StatusCard
        title="Sign in to accept your invite"
        description="Create an account or sign in with the email this invite was sent to, then you'll be added automatically."
        action={
          <Link
            href={`/login?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`}
            className="mt-6 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
          >
            Sign in / Register
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <StatusCard
        title="Couldn't accept invite"
        description={error}
        action={
          <Link href="/" className="mt-6 inline-block text-sm text-indigo-400 hover:underline">
            Go to your organizations
          </Link>
        }
      />
    );
  }

  return <CenteredSpinner />;
}

function CenteredSpinner() {
  return (
    <main className="grid min-h-screen place-items-center">
      <Spinner className="h-6 w-6 text-zinc-500" />
    </main>
  );
}

function StatusCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={44} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">{description}</p>
        {action}
      </div>
    </main>
  );
}
