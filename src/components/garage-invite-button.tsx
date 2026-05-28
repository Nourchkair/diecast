'use client';

import { useState } from 'react';

type Props = {
  slug: string;
  label?: string;
  className?: string;
};

export function GarageInviteButton({ slug, label = 'Create invite link', className = '' }: Props) {
  const [pending, setPending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function copyToClipboard(text: string) {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copied) throw new Error('Clipboard not available');
  }

  async function createInvite() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/garages/${slug}/invite`, { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Could not create invite');
      const url = `${window.location.origin}/garages/invites/${data.invite.token}`;
      setInviteLink(url);
      await copyToClipboard(url).catch(() => undefined);
      setMessage('Invite link created and copied.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create invite');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => void createInvite()} disabled={pending} className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${className}`} style={{ backgroundColor: 'var(--app-accent)', color: 'var(--app-accent-foreground)' }}>
        {pending ? 'Creating…' : label}
      </button>
      {inviteLink ? <p className="break-all text-xs text-zinc-300">{inviteLink}</p> : null}
      {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
    </div>
  );
}
