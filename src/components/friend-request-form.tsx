'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  defaultIdentifier?: string;
};

export function FriendRequestForm({ defaultIdentifier = '' }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendRequest() {
    if (!identifier.trim()) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not send request');
      setMessage('Friend request sent.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send request');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Search by email, username, or user code" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" />
      <button type="button" onClick={() => void sendRequest()} disabled={pending} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
        {pending ? 'Sending…' : 'Add friend'}
      </button>
      {message ? <p className="sm:col-span-2 text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
