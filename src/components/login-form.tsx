'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo } });
      if (error) throw error;
      setMessage('Check your inbox for the magic link.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send link.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="grid gap-2">
        <span className="text-sm text-zinc-300">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-emerald-400/50"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {pending ? 'Sending link…' : 'Send magic link'}
      </button>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </form>
  );
}
