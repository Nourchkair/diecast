import { notFound } from 'next/navigation';
import { requireCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GarageInviteAcceptButton } from '@/components/garage-invite-accept-button';

type Params = Promise<{ token: string }>;

export default async function GarageInvitePage({ params }: { params: Params }) {
  const { token } = await params;
  await requireCurrentUser();

  const invite = await prisma.garageInvite.findUnique({
    where: { token },
    include: { garage: true },
  });

  if (!invite) notFound();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-10">
      <section className="w-full space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Garage invite</p>
        <h1 className="text-2xl font-semibold text-white">{invite.garage.name}</h1>
        {invite.garage.description ? <p className="text-sm text-zinc-300">{invite.garage.description}</p> : null}
        <p className="text-sm text-zinc-400">{invite.usedAt ? 'This invite has already been used.' : invite.expiresAt.getTime() < Date.now() ? 'This invite has expired.' : 'Join this garage with one tap.'}</p>
        {!invite.usedAt && invite.expiresAt.getTime() >= Date.now() ? <GarageInviteAcceptButton token={token} garageSlug={invite.garage.slug} /> : null}
      </section>
    </div>
  );
}
