'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Sparkles } from 'lucide-react';

type CommentItem = {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { displayName: string | null; username: string };
};

type Props = {
  itemId: string;
  initialFavorite: boolean;
  initialWishlist: boolean;
  comments: CommentItem[];
};

export function CarSocialPanel({ itemId, initialFavorite, initialWishlist, comments }: Props) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function toggle(endpoint: 'favorite' | 'wishlist', next: boolean) {
    if (pending) return;
    setPending(true);
    const previous = endpoint === 'favorite' ? favorite : wishlist;
    if (endpoint === 'favorite') setFavorite(next);
    else setWishlist(next);

    try {
      const response = await fetch(`/api/cars/${itemId}/${endpoint}`, { method: next ? 'POST' : 'DELETE' });
      if (!response.ok) throw new Error('Could not update');
      router.refresh();
    } catch {
      if (endpoint === 'favorite') setFavorite(previous);
      else setWishlist(previous);
    } finally {
      setPending(false);
    }
  }

  async function submitComment() {
    if (!body.trim()) return;
    setPending(true);
    try {
      const response = await fetch(`/api/cars/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error('Could not post comment');
      setBody('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void toggle('favorite', !favorite)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${favorite ? 'bg-white text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`}>
          <Heart className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
          {favorite ? 'Favorited' : 'Favorite'}
        </button>
        <button type="button" onClick={() => void toggle('wishlist', !wishlist)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${wishlist ? 'bg-white text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`}>
          <Sparkles className="h-4 w-4" />
          {wishlist ? 'On wishlist' : 'Add to wishlist'}
        </button>
      </div>

      <div className="grid gap-3">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} placeholder="Write a comment" className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" />
        <button type="button" onClick={() => void submitComment()} disabled={pending} className="rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
          {pending ? 'Posting…' : 'Post comment'}
        </button>
      </div>

      <div className="space-y-2">
        {comments.length ? comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
            <div className="text-xs text-zinc-500">{comment.author.displayName ?? comment.author.username}</div>
            <div className="mt-1 text-white">{comment.body}</div>
          </div>
        )) : <p className="text-sm text-zinc-400">No comments yet.</p>}
      </div>
    </section>
  );
}
