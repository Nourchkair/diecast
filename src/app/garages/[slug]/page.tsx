import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import { getGarageBySlug } from '@/lib/social';
import { GarageNameEditor } from '@/components/garage-name-editor';

type Params = Promise<{ slug: string }>;

export default async function GaragePage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await requireCurrentUser();
  const garage = await getGarageBySlug(slug, user.id);
  if (!garage) notFound();
  if (garage.type === 'SHARED') redirect(`/garages/${garage.slug}/enter`);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Garage</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{garage.name}</h1>
        {garage.description ? <p className="mt-2 text-sm text-zinc-300">{garage.description}</p> : null}
        <p className="mt-2 text-xs text-zinc-500">{garage.type === 'PERSONAL' ? 'Personal garage' : 'Shared garage'}</p>
      </section>

      {garage.type === 'PERSONAL' ? <GarageNameEditor slug={garage.slug} initialName={garage.name} /> : null}

      <section className="space-y-4 px-1">
        <h2 className="text-lg font-semibold text-white">Members</h2>
        <div className="flex flex-wrap gap-2">
          {garage.members.map((member) => (
            <span key={member.userId} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">{member.user.displayName ?? member.user.username}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
