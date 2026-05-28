'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GarageCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createGarage() {
    if (!name.trim()) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not create garage');
      setName('');
      setDescription('');
      setMessage('Garage created.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create garage');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Shared garage name" className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" />
      <button type="button" onClick={() => void createGarage()} disabled={pending} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
        {pending ? 'Creating…' : 'Create shared garage'}
      </button>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
