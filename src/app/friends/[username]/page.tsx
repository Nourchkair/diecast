import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
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
                <Link key={item.id} href={`/collection/${item.id}`} className="rounded-[1.8rem] border border-white/8 bg-white/5 p-3 transition hover:-translate-y-0.5 hover:bg-white/8">
                  <div className="space-y-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-zinc-900">
                      {item.images?.[0] ? (
                        <Image src={item.images[0].filePath} alt={item.displayName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">No photo</div>
                      )}
                    </div>

                    <div className="px-1 pb-1">
                      <h3 className="truncate text-sm font-semibold text-white">{item.displayName}</h3>
                      <p className="mt-1 truncate text-xs text-zinc-400">{item.brand} {item.year ?? ''}</p>
                    </div>
                  </div>
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
