'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  initialName: string;
};

export function GarageNameEditor({ slug, initialName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function saveName() {
    if (!name.trim()) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/garages/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not rename garage');
      setMessage('Garage name saved.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not rename garage');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Personal garage</p>
        <p className="mt-1 text-sm text-zinc-400">Rename your garage.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" />
        <button type="button" onClick={() => void saveName()} disabled={pending} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
          {pending ? 'Saving…' : 'Save name'}
        </button>
      </div>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
