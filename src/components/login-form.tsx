"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LoginForm({ onModeChange }: { onModeChange?: (mode: 'login' | 'signup') => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isSignup = mode === 'signup';

  function setAuthMode(nextMode: 'login' | 'signup') {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  async function runAuth(mode: 'login' | 'signup') {
    if (!email.trim() || !password) return;
    setPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const credentials = { email: email.trim(), password };
      const { data, error } = mode === 'login'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
      if (error) throw error;
      if (data.session) {
        router.replace('/collection');
        router.refresh();
        return;
      }
      setMessage(mode === 'login' ? 'Logged in.' : 'Account created. You can now log in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAuth(mode);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm text-zinc-300">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="border-b border-white/15 bg-transparent px-0 py-3 text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-emerald-400/50"
          placeholder="you@example.com"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-zinc-300">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          className="border-b border-white/15 bg-transparent px-0 py-3 text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-emerald-400/50"
          placeholder="Your password"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
        >
          {pending ? (isSignup ? 'Creating…' : 'Logging in…') : (isSignup ? 'Create account' : 'Log in')}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setAuthMode(isSignup ? 'login' : 'signup')}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSignup ? 'Back to login' : 'Create account'}
        </button>
      </div>
      <p className="text-sm text-zinc-400">
        {isSignup ? 'New account mode.' : 'Existing account mode.'}
      </p>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
    </form>
  );
}
