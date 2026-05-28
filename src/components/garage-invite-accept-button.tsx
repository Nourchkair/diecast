'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  token: string;
  garageSlug: string;
};

export function GarageInviteAcceptButton({ token, garageSlug }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/garages/invites/${token}`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not accept invite');
      router.push(`/garages/${garageSlug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not accept invite');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => void accept()} disabled={pending} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
        {pending ? 'Joining…' : 'Accept invite'}
      </button>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
