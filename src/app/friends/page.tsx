import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser } from '@/lib/auth';
import { FriendRequestList } from '@/components/friend-request-list';
import { getUserFeed, listFriendRequests, listFriends, listUserGarages, makeUserCode } from '@/lib/social';
import { ActivityFeedList } from '@/components/activity-feed-list';
import { NetworkActionPanels } from '@/components/network-action-panels';

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function FriendsPage() {
  const user = await requireCurrentUser();

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const carsTotal = await prisma.diecastItem.count({ where: { userId: user.id } });
  const friends = await listFriends(user.id);
  const requests = await listFriendRequests(user.id);
  const garages = await listUserGarages(user.id);
  const feed = await getUserFeed(user.id);
  const sharedGarages = garages.filter((garage) => garage.type === 'SHARED');

  return (
    <div className="space-y-6 pb-8">
      <section className="px-1 py-1">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Network</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Your account</h1>
        <div className="mt-4 flex items-start gap-4 sm:items-center sm:gap-5">
          <div className="flex h-24 w-24 flex-none aspect-square items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-xl font-semibold text-white shadow-lg shadow-black/20 sm:h-28 sm:w-28" style={{ borderRadius: '9999px' }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName ?? profile.username} className="block h-full w-full rounded-full object-cover" style={{ borderRadius: '9999px' }} />
            ) : (
              <span className="leading-none">{initials(profile?.displayName ?? profile?.username ?? user.email ?? 'You')}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-all text-sm text-white">{profile?.email ?? user.email ?? 'Not set'}</p>
            <p className="mt-1 text-sm text-zinc-300">@{profile?.username}</p>
            <p className="mt-1 text-sm text-zinc-400">{makeUserCode(user.id)}</p>

            <div className="mt-4 text-sm text-zinc-300">
              Cars {carsTotal} · Garages {garages.length}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <NetworkActionPanels />
        </div>
      </section>

      <section className="space-y-4 px-1 py-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending requests</h2>
        </div>
        <FriendRequestList requests={requests as unknown as Array<{ id: string; senderId: string; receiverId: string; sender: { username: string; displayName: string | null }; receiver: { username: string; displayName: string | null }; status: string }>} currentUserId={user.id} />
      </section>

      <section className="space-y-4 px-1 py-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Connections</h2>
        </div>
        {friends.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {friends.map((friend) => (
              <Link key={friend.userId} href={`/friends/${friend.username}`} className="flex items-start justify-between gap-3 py-2 text-sm text-zinc-300 transition hover:text-white">
                <div className="min-w-0">
                  <div className="font-medium text-white">{friend.displayName ?? friend.username}</div>
                  <div className="text-xs text-zinc-500">@{friend.username}</div>
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : <p className="text-sm text-zinc-400">No connections yet.</p>}
      </section>

      <section className="space-y-4 px-1 py-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Shared garages</h2>
        </div>
        {sharedGarages.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {sharedGarages.map((garage) => (
              <Link key={garage.id} href={`/garages/${garage.slug}`} className="flex items-start justify-between gap-3 py-2 text-sm text-zinc-300 transition hover:text-white">
                <div className="min-w-0">
                  <div className="font-medium text-white">{garage.name}</div>
                  <div className="text-xs text-zinc-500">{garage.type === 'PERSONAL' ? 'Personal garage' : 'Shared garage'}</div>
                </div>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 px-1 py-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Activity feed</h2>
        </div>
        {feed.length ? <ActivityFeedList events={feed as unknown as Array<{
          id: string;
          type: string;
          note: string | null;
          createdAt: string | Date;
          actor: { displayName: string | null; username: string };
        }>} /> : <p className="text-sm text-zinc-400">No activity yet.</p>}
      </section>
    </div>
  );
}
