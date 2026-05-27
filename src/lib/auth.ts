import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function claimLegacyOwnership(userId: string) {
  try {
    const [ownedItems, legacyItems, ownedTags, legacyTags] = await Promise.all([
      prisma.diecastItem.count({ where: { userId } }),
      prisma.diecastItem.count({ where: { userId: null } }),
      prisma.tag.count({ where: { userId } }),
      prisma.tag.count({ where: { userId: null } }),
    ]);

    if (!ownedItems && legacyItems) {
      await prisma.diecastItem.updateMany({ where: { userId: null }, data: { userId } });
    }

    if (!ownedTags && legacyTags) {
      await prisma.tag.updateMany({ where: { userId: null }, data: { userId } });
    }
  } catch {
    // Leave auth intact if the ownership claim fails.
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await claimLegacyOwnership(user.id);
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
