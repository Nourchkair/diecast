import { redirect } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'garage';
}

function makeUsername(email: string | null | undefined, userId: string) {
  const localPart = email?.split('@')[0] ?? 'driver';
  const safe = slugify(localPart).slice(0, 16) || 'driver';
  return `${safe}-${userId.slice(0, 6).toLowerCase()}`;
}

function makeUserCode(userId: string) {
  return userId.slice(0, 8).toUpperCase();
}

function buildPersonalGarageName(username: string) {
  return `${username}'s Garage`;
}

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

async function ensureUserProfile(user: { id: string; email?: string | null }) {
  const email = user.email?.trim().toLowerCase() ?? null;
  const existing = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    if (email && email !== existing.email) {
      return prisma.userProfile.update({
        where: { userId: user.id },
        data: { email },
      });
    }
    return existing;
  }

  const username = makeUsername(user.email ?? null, user.id);
  return prisma.userProfile.create({
    data: {
      userId: user.id,
      username,
      email,
      displayName: user.email?.split('@')[0] ?? username,
    },
  });
}

export async function getOrCreatePersonalGarage(user: { id: string; email?: string | null }) {
  const profile = await ensureUserProfile(user);
  const existing = await prisma.garage.findUnique({ where: { personalOwnerId: user.id } });
  if (existing) {
    const defaultOldName = `${profile.displayName ?? profile.username}'s Garage`;
    const defaultNewName = buildPersonalGarageName(profile.username);
    if (existing.name === defaultOldName && existing.name !== defaultNewName) {
      return prisma.garage.update({
        where: { id: existing.id },
        data: { name: defaultNewName },
      });
    }
    return existing;
  }

  const slug = `garage-${user.id.slice(0, 8).toLowerCase()}`;
  const garage = await prisma.garage.create({
    data: {
      name: buildPersonalGarageName(profile.username),
      slug,
      type: 'PERSONAL',
      personalOwnerId: user.id,
      createdByUserId: user.id,
      members: {
        create: { userId: user.id },
      },
    },
  });

  await prisma.diecastItem.updateMany({
    where: { userId: user.id, primaryGarageId: null },
    data: { primaryGarageId: garage.id },
  });

  return garage;
}

async function ensureSocialState(user: { id: string; email?: string | null }) {
  await ensureUserProfile(user);
  await getOrCreatePersonalGarage(user);
}

export async function bootstrapCurrentUser(user: { id: string; email?: string | null }) {
  await claimLegacyOwnership(user.id);
  await ensureSocialState(user);
}

export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
