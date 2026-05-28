import Link from 'next/link';
import { requireCurrentUser } from '@/lib/auth';
import { listUserGarages } from '@/lib/social';

export default async function GaragesIndexPage() {
  const user = await requireCurrentUser();
  const garages = (await listUserGarages(user.id)).filter((garage) => garage.type === 'SHARED');

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Shared Garages</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Garages you belong to</h1>
        <p className="mt-2 text-sm text-zinc-400">Open a shared garage to see its cars and members.</p>
      </section>

      {garages.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {garages.map((garage) => (
            <Link key={garage.id} href={`/garages/${garage.slug}`} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Shared garage</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{garage.name}</h2>
              {garage.description ? <p className="mt-2 text-sm text-zinc-400">{garage.description}</p> : null}
              <p className="mt-4 text-xs text-zinc-500">{garage.members.length} member{garage.members.length === 1 ? '' : 's'}</p>
            </Link>
          ))}
        </section>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center text-zinc-400">
          You are not in any shared garages yet.
        </section>
      )}
    </div>
  );
}
