import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DiecastForm } from '@/components/diecast-form';
import { requireCurrentUser } from '@/lib/auth';

type Params = Promise<{ id: string }>;

export default async function EditItemPage({ params }: { params: Params }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const item = await prisma.diecastItem.findFirst({ where: { id, userId: user.id }, include: { images: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] }, tags: { include: { tag: true } } } });
  if (!item) notFound();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/collection/${item.id}`} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200">Back</Link>
        <h1 className="text-lg font-semibold text-white">Edit item</h1>
      </div>
      <DiecastForm
        mode="edit"
        initialItem={{
          ...item,
          tagNames: item.tags.map((link) => link.tag.name),
        }}
        onSavedHref={`/collection/${item.id}`}
      />
    </div>
  );
}
