import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireCurrentUser } from '@/lib/auth';
import { FriendRequestForm } from '@/components/friend-request-form';
import { FriendRequestList } from '@/components/friend-request-list';
import { GarageCreateForm } from '@/components/garage-create-form';
import { getUserFeed, listFriendRequests, listFriends, listUserGarages, makeUserCode, searchProfiles } from '@/lib/social';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function eventLabel(type: string) {
  switch (type) {
    case 'ADDED_CAR': return 'added a car';
    case 'FAVORITED_CAR': return 'favorited a car';
    case 'WISHLISTED_CAR': return 'added a car to wishlist';
    case 'COMMENTED_CAR': return 'commented on a car';
    case 'CREATED_GARAGE': return 'created a garage';
    case 'JOINED_GARAGE': return 'joined a garage';
    case 'SHARED_CAR': return 'shared a car';
    case 'FEATURED_CAR': return 'featured a car';
    case 'FRIEND_REQUEST_SENT': return 'sent a friend request';
    case 'FRIEND_REQUEST_ACCEPTED': return 'became friends';
    default: return type.toLowerCase().replace(/_/g, ' ');
  }
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default async function FriendsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const query = first(params.q) ?? '';

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  const carsTotal = await prisma.diecastItem.count({ where: { userId: user.id } });
  const profiles = query ? await searchProfiles(query, user.id) : [];
  const friends = await listFriends(user.id);
  const requests = await listFriendRequests(user.id);
  const garages = await listUserGarages(user.id);
  const feed = await getUserFeed(user.id, friends.map((friend) => friend.userId));
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

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">Cars {carsTotal}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">Garages {garages.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Find people</h2>
          <p className="text-sm text-zinc-400">Search by email, username, or user code and send a request.</p>
        </div>
        <form>
          <FriendRequestForm defaultIdentifier={query} />
        </form>
        {profiles.length ? (
          <div className="grid gap-2">
            {profiles.map((profile) => (
              <Link key={profile.userId} href={`/friends/${profile.username}`} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <div className="font-medium text-white">{profile.displayName ?? profile.username}</div>
                <div className="text-xs text-zinc-500">@{profile.username}</div>
                <div className="mt-1 text-xs text-zinc-500">{profile.email ?? 'No email'} • {makeUserCode(profile.userId)}</div>
              </Link>
            ))}
          </div>
        ) : query ? <p className="text-sm text-zinc-400">No profiles found.</p> : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending requests</h2>
        </div>
        <FriendRequestList requests={requests as unknown as Array<{ id: string; senderId: string; receiverId: string; sender: { username: string; displayName: string | null }; receiver: { username: string; displayName: string | null }; status: string }>} currentUserId={user.id} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Connections</h2>
        </div>
        {friends.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {friends.map((friend) => (
              <Link key={friend.userId} href={`/friends/${friend.username}`} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <div className="font-medium text-white">{friend.displayName ?? friend.username}</div>
                <div className="text-xs text-zinc-500">@{friend.username}</div>
              </Link>
            ))}
          </div>
        ) : <p className="text-sm text-zinc-400">No connections yet.</p>}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Shared garages</h2>
          <p className="text-sm text-zinc-400">Create a garage and invite friends.</p>
        </div>
        <GarageCreateForm />
        {sharedGarages.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {sharedGarages.map((garage) => (
              <Link key={garage.id} href={`/garages/${garage.slug}`} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <div className="font-medium text-white">{garage.name}</div>
                <div className="text-xs text-zinc-500">{garage.type === 'PERSONAL' ? 'Personal garage' : 'Shared garage'}</div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Activity feed</h2>
        </div>
        {feed.length ? (
          <div className="space-y-2">
            {feed.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                <p className="text-white"><span className="font-medium">{event.actor.displayName ?? event.actor.username}</span> {eventLabel(event.type)}</p>
                {event.note ? <p className="mt-1 text-xs text-zinc-500">{event.note}</p> : null}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-zinc-400">No activity yet.</p>}
      </section>
    </div>
  );
}
