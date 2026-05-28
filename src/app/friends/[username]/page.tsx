import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import { getProfileByUsername, getFriendshipStatus } from '@/lib/social';
import { listItems } from '@/lib/items';
import { FriendRequestForm } from '@/components/friend-request-form';

type Params = Promise<{ username: string }>;

export default async function FriendProfilePage({ params }: { params: Params }) {
  const { username } = await params;
  const user = await requireCurrentUser();
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const status = await getFriendshipStatus(user.id, profile.userId);
  const canView = profile.userId === user.id || status === 'friends';
  const items = canView ? await listItems({}, profile.userId) : [];

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Profile</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{profile.displayName ?? profile.username}</h1>
        <p className="mt-1 text-sm text-zinc-400">@{profile.username}</p>
        {profile.bio ? <p className="mt-3 text-sm text-zinc-300">{profile.bio}</p> : null}
        {status === 'none' ? <div className="mt-4"><FriendRequestForm defaultIdentifier={profile.username} /></div> : null}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Garage</h2>
        </div>
        {canView ? (
          items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <Link key={item.id} href={`/collection/${item.id}`} className="rounded-2xl border border-white/8 bg-zinc-950/70 p-3 text-sm text-zinc-300">
                  <div className="font-medium text-white">{item.displayName}</div>
                  <div className="text-xs text-zinc-500">{item.brand} {item.make} {item.model}</div>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-zinc-400">No cars shared yet.</p>
        ) : (
          <p className="text-sm text-zinc-400">Become friends to see this garage.</p>
        )}
      </section>
    </div>
  );
}
