'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RequestItem = {
  id: string;
  senderId: string;
  receiverId: string;
  sender: { username: string; displayName: string | null };
  receiver: { username: string; displayName: string | null };
  status: string;
};

type Props = {
  requests: RequestItem[];
  currentUserId: string;
};

export function FriendRequestList({ requests, currentUserId }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handle(id: string, status: 'ACCEPTED' | 'REJECTED') {
    setBusyId(id);
    try {
      const response = await fetch(`/api/friends/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Could not update request');
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (!requests.length) return <p className="text-sm text-zinc-400">No pending requests.</p>;

  return (
    <div className="space-y-2">
      {requests.map((request) => {
        const incoming = request.receiverId === currentUserId;
        return (
          <div key={request.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{request.sender.displayName ?? request.sender.username}</p>
                <p className="text-xs text-zinc-500">@{request.sender.username}</p>
              </div>
              {incoming ? (
                <div className="flex gap-2">
                  <button type="button" disabled={busyId === request.id} onClick={() => void handle(request.id, 'ACCEPTED')} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white disabled:opacity-50">Accept</button>
                  <button type="button" disabled={busyId === request.id} onClick={() => void handle(request.id, 'REJECTED')} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white disabled:opacity-50">Reject</button>
                </div>
              ) : (
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300">Pending</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
