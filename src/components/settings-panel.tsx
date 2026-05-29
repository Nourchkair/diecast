'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { buildBodyBackground, buildThemeVariables, normalizeThemeSettings, type ThemeSettings } from '@/lib/theme';

function makeUserCode(userId: string) {
  return userId.slice(0, 8).toUpperCase();
}

type ProfileEditorView = 'profile' | 'password';

type Props = {
  email: string;
  initialTheme: ThemeSettings;
  initialProfile: {
    userId: string;
    email: string | null;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
};

export function SettingsPanel({ email, initialTheme, initialProfile }: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState(() => normalizeThemeSettings(initialTheme));
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [profileDraft, setProfileDraft] = useState(initialProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileEditorView, setProfileEditorView] = useState<ProfileEditorView>('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetDragStartY = useRef<number | null>(null);

  const backgroundPreview = useMemo(() => {
    if (backgroundFile) return URL.createObjectURL(backgroundFile);
    return theme.backgroundImageUrl;
  }, [backgroundFile, theme.backgroundImageUrl]);

  const editorAvatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profileDraft.avatarUrl;
  }, [avatarFile, profileDraft.avatarUrl]);

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

  useEffect(() => {
    if (!avatarFile || !editorAvatarPreview) return undefined;
    return () => URL.revokeObjectURL(editorAvatarPreview);
  }, [avatarFile, editorAvatarPreview]);

  useEffect(() => {
    if (!profileEditorOpen) return undefined;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [profileEditorOpen]);

  async function uploadBackgroundImage() {
    if (!backgroundFile) return theme.backgroundImageUrl;
    const body = new FormData();
    body.append('file', backgroundFile);
    const response = await fetch('/api/uploads', { method: 'POST', body });
    if (!response.ok) throw new Error('Background upload failed');
    const data = await response.json();
    return String(data.filePath ?? '').trim() || null;
  }

  async function uploadAvatarImage() {
    if (!avatarFile) return profile.avatarUrl;
    const body = new FormData();
    body.append('file', avatarFile);
    const response = await fetch('/api/uploads', { method: 'POST', body });
    if (!response.ok) throw new Error('Profile photo upload failed');
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

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const avatarUrl = avatarFile ? await uploadAvatarImage() : profileDraft.avatarUrl;
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileDraft.username,
          displayName: profileDraft.displayName,
          bio: profileDraft.bio,
          avatarUrl,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Could not save profile');
      }
      const data = await response.json();
      setProfile(data.profile);
      setProfileDraft(data.profile);
      setAvatarFile(null);
      setProfileEditorOpen(false);
      setProfileEditorView('profile');
      setProfileMessage('Profile saved.');
      router.refresh();
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Could not save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  function openProfileEditor() {
    setProfileDraft(profile);
    setAvatarFile(null);
    setSheetDragY(0);
    setProfileEditorView('profile');
    setProfileEditorOpen(true);
  }

  function openPasswordEditor() {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(null);
    setProfileEditorView('password');
  }

  function backToProfileEditor() {
    setProfileEditorView('profile');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(null);
  }

  function closeProfileEditor() {
    setProfileEditorOpen(false);
    setAvatarFile(null);
    setSheetDragY(0);
    sheetDragStartY.current = null;
    setProfileDraft(profile);
    setProfileEditorView('profile');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage(null);
  }

  function handleSheetDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    sheetDragStartY.current = event.clientY;
    (event.currentTarget as HTMLDivElement).setPointerCapture?.(event.pointerId);
  }

  function handleSheetDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (sheetDragStartY.current === null) return;
    const delta = Math.max(0, event.clientY - sheetDragStartY.current);
    setSheetDragY(delta);
  }

  function handleSheetDragEnd() {
    if (sheetDragStartY.current === null) return;
    const shouldClose = sheetDragY > 90;
    sheetDragStartY.current = null;
    if (shouldClose) {
      closeProfileEditor();
      return;
    }
    setSheetDragY(0);
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
      setProfileEditorView('profile');
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 px-1 py-1">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Profile</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Your account</h2>
        </div>
        <div className="flex items-start gap-4 sm:items-center sm:gap-5">
          <div className="flex-none">
            <div className="flex h-24 w-24 aspect-square items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-xl font-semibold text-white shadow-lg shadow-black/20 sm:h-28 sm:w-28" style={{ borderRadius: '9999px' }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName ?? profile.username} className="block h-full w-full rounded-full object-cover" style={{ borderRadius: '9999px' }} />
              ) : (
                <span className="leading-none">{(profile.displayName ?? profile.username).trim().slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <p className="mt-3 max-w-24 text-sm text-zinc-400 sm:max-w-28">{profile.bio ?? 'Bio not set'}</p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <p className="text-lg font-semibold text-white">{profile.displayName ?? profile.username}</p>
                <p className="break-all text-sm text-white">{profile.email ?? email}</p>
                <p className="text-sm text-zinc-300">@{profile.username}</p>
                <p className="text-sm text-zinc-400">User code: {makeUserCode(profile.userId)}</p>
              </div>
              <button type="button" onClick={openProfileEditor} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
                Edit
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={`fixed inset-0 z-[100] transition ${profileEditorOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!profileEditorOpen}>
        <button type="button" className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${profileEditorOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeProfileEditor} />
        <div
          className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-[2rem] border border-white/10 bg-zinc-950/95 shadow-2xl shadow-black/60 backdrop-blur-2xl ${profileEditorOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: profileEditorOpen ? `translateY(${sheetDragY}px)` : 'translateY(140%)',
            transition: sheetDragStartY.current === null ? 'transform 300ms ease-out, opacity 300ms ease-out' : 'none',
          }}
        >
          <div
            className="touch-none select-none"
            onPointerDown={handleSheetDragStart}
            onPointerMove={handleSheetDragMove}
            onPointerUp={handleSheetDragEnd}
            onPointerCancel={handleSheetDragEnd}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20" />
          </div>
          <div className="max-h-[85vh] overflow-y-auto p-5 space-y-4">
            {profileEditorView === 'profile' ? (
              <>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Edit profile</p>
                  <h2 className="mt-2 text-lg font-semibold text-white">Update photo, display name, username, and bio</h2>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-xl font-semibold text-white shadow-lg shadow-black/20 sm:h-28 sm:w-28" style={{ borderRadius: '9999px' }}>
                    {editorAvatarPreview ? (
                      <img src={editorAvatarPreview} alt={profileDraft.displayName ?? profileDraft.username} className="block h-full w-full rounded-full object-cover" style={{ borderRadius: '9999px' }} />
                    ) : (
                      <span className="leading-none">{(profileDraft.displayName ?? profileDraft.username).trim().slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="break-all text-sm text-white">{profileDraft.email ?? email}</p>
                    <p className="text-sm text-zinc-300">@{profileDraft.username}</p>
                    <p className="text-sm text-zinc-400">User code: {makeUserCode(profileDraft.userId)}</p>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/10">
                        {avatarFile ? 'Change profile photo' : 'Upload profile photo'}
                        <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} className="sr-only" />
                      </label>
                      {(avatarFile || profileDraft.avatarUrl) ? (
                        <button type="button" onClick={() => { setAvatarFile(null); setProfileDraft((current) => ({ ...current, avatarUrl: null })); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:bg-white/10">
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm text-zinc-300">Display name</span>
                    <input value={profileDraft.displayName ?? ''} onChange={(event) => setProfileDraft((current) => ({ ...current, displayName: event.target.value }))} className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white" placeholder="What should we call you?" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-zinc-300">Username</span>
                    <input value={profileDraft.username} onChange={(event) => setProfileDraft((current) => ({ ...current, username: event.target.value }))} className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white" placeholder="your-username" />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-zinc-300">Bio</span>
                    <textarea value={profileDraft.bio ?? ''} onChange={(event) => setProfileDraft((current) => ({ ...current, bio: event.target.value }))} rows={4} className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white" placeholder="Tell friends about your garage" />
                  </label>
                </div>

                <button type="button" onClick={openPasswordEditor} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  Change password
                </button>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={closeProfileEditor} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">
                    Cancel
                  </button>
                  <button type="button" onClick={() => void saveProfile()} disabled={savingProfile} className="rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-[var(--app-accent-foreground)] disabled:opacity-50">
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </button>
                </div>

                {profileMessage ? <p className="text-sm text-zinc-300">{profileMessage}</p> : null}
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Edit profile</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">Change password</h2>
                  </div>
                  <button type="button" onClick={backToProfileEditor} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="grid gap-3">
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm text-zinc-300">New password</span>
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" placeholder="Minimum 8 characters" />
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm text-zinc-300">Confirm password</span>
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white" placeholder="Repeat new password" />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={backToProfileEditor} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">
                    Back
                  </button>
                  <button type="button" onClick={() => void changePassword()} disabled={savingPassword} className="rounded-2xl bg-[var(--app-accent)] px-4 py-3 text-sm font-semibold text-[var(--app-accent-foreground)] disabled:opacity-50">
                    {savingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </div>

                {passwordMessage ? <p className="text-sm text-zinc-300">{passwordMessage}</p> : null}
              </>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4 px-1 py-1">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Appearance</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Theme settings</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-300">Accent color</span>
            <input type="color" value={theme.accentColor} onChange={(event) => setTheme((current) => ({ ...current, accentColor: event.target.value }))} className="color-swatch" />
          </label>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-300">Background color</span>
            <input type="color" value={theme.backgroundColor} onChange={(event) => setTheme((current) => ({ ...current, backgroundColor: event.target.value }))} className="color-swatch" />
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

      <section className="pb-2">
        <form action="/auth/logout" method="post">
          <button type="submit" className="w-full rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
