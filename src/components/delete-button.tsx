'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm('Delete this diecast from your collection?');
    if (!confirmed) return;
    setPending(true);
    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      router.push('/collection');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={pending} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 disabled:opacity-50">
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
