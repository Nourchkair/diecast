'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { buildBodyBackground, buildThemeVariables, normalizeThemeSettings, type ThemeSettings } from '@/lib/theme';

type Props = {
  email: string;
  initialTheme: ThemeSettings;
};

export function SettingsPanel({ email, initialTheme }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState(() => normalizeThemeSettings(initialTheme));
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const backgroundPreview = useMemo(() => {
    if (backgroundFile) return URL.createObjectURL(backgroundFile);
    return theme.backgroundImageUrl;
  }, [backgroundFile, theme.backgroundImageUrl]);

  const previewSettings = useMemo(() => ({
    ...theme,
    backgroundImageUrl: backgroundPreview,
  }), [backgroundPreview, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const themeVariables = buildThemeVariables(previewSettings);
    Object.entries(themeVariables).forEach(([key, value]) => root.style.setProperty(key, value));

    const backgroundStyles = buildBodyBackground(previewSettings);
    body.style.backgroundColor = backgroundStyles.backgroundColor;
    body.style.backgroundImage = backgroundStyles.backgroundImage;
    body.style.backgroundSize = backgroundStyles.backgroundSize;
    body.style.backgroundPosition = backgroundStyles.backgroundPosition;
    body.style.backgroundAttachment = backgroundStyles.backgroundAttachment;
    body.style.backgroundRepeat = backgroundStyles.backgroundRepeat;
  }, [previewSettings]);

  useEffect(() => {
    if (!backgroundFile || !backgroundPreview) return undefined;
    return () => URL.revokeObjectURL(backgroundPreview);
  }, [backgroundFile, backgroundPreview]);

  async function uploadBackgroundImage() {
    if (!backgroundFile) return theme.backgroundImageUrl;
    const body = new FormData();
    body.append('file', backgroundFile);
    const response = await fetch('/api/uploads', { method: 'POST', body });
    if (!response.ok) throw new Error('Background upload failed');
    const data = await response.json();
    return String(data.filePath ?? '').trim() || null;
  }

  async function saveTheme() {
    setSavingTheme(true);
    setThemeMessage(null);
    try {
      const backgroundImageUrl = backgroundFile ? await uploadBackgroundImage() : theme.backgroundImageUrl;
      const response = await fetch('/api/settings/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          backgroundImageUrl,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Could not save theme');
      }
      const data = await response.json();
      const nextTheme = normalizeThemeSettings(data.theme);
      setTheme(nextTheme);
      setBackgroundFile(null);
      setThemeMessage('Theme saved.');
      router.refresh();
    } catch (error) {
      setThemeMessage(error instanceof Error ? error.message : 'Could not save theme');
    } finally {
      setSavingTheme(false);
    }
  }

  async function changePassword() {
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Signed in</p>
        <p className="mt-2 text-white">{email}</p>
        <form action="/auth/logout" method="post" className="mt-4">
          <button type="submit" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">Sign out</button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Password</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Change password</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">New password</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" placeholder="Minimum 8 characters" />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Confirm password</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" placeholder="Repeat new password" />
          </label>
        </div>
        <button type="button" onClick={() => void changePassword()} disabled={savingPassword} className="rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-[var(--app-accent-foreground)] disabled:opacity-50">
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
        {passwordMessage ? <p className="text-sm text-zinc-300">{passwordMessage}</p> : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Appearance</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Theme settings</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Accent color</span>
            <input type="color" value={theme.accentColor} onChange={(event) => setTheme((current) => ({ ...current, accentColor: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 p-1" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Background color</span>
            <input type="color" value={theme.backgroundColor} onChange={(event) => setTheme((current) => ({ ...current, backgroundColor: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950 p-1" />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Background image</span>
            <input type="file" accept="image/*" onChange={(event) => setBackgroundFile(event.target.files?.[0] ?? null)} className="rounded-2xl border border-dashed border-white/15 bg-zinc-950 px-4 py-3 text-white" />
          </label>
        </div>

        {backgroundPreview ? (
          <div className="relative aspect-[16/7] overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-900">
            <div className="absolute inset-0 bg-black/25" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backgroundPreview} alt="Background preview" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void saveTheme()} disabled={savingTheme} className="rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-[var(--app-accent-foreground)] disabled:opacity-50">
            {savingTheme ? 'Saving…' : 'Save appearance'}
          </button>
          <button type="button" onClick={() => {
            setTheme({ accentColor: '#10b981', backgroundColor: '#09090b', backgroundImageUrl: null });
            setBackgroundFile(null);
          }} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">
            Reset defaults
          </button>
          {backgroundPreview ? (
            <button type="button" onClick={() => {
              setTheme((current) => ({ ...current, backgroundImageUrl: null }));
              setBackgroundFile(null);
            }} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">
              Remove background image
            </button>
          ) : null}
        </div>

        {themeMessage ? <p className="text-sm text-zinc-300">{themeMessage}</p> : null}
      </section>
    </div>
  );
}
