import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { prisma } from '@/lib/prisma';
import { normalizeUsername } from '@/lib/social';

const profileSchema = z.object({
  username: z.string().min(3).max(24).optional(),
  displayName: z.string().max(50).nullable().optional(),
  bio: z.string().max(180).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function GET() {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const data = parsed.data;
  const nextUsername = data.username ? normalizeUsername(data.username) : profile.username;

  try {
    const updated = await prisma.userProfile.update({
      where: { userId: user.id },
      data: {
        username: nextUsername,
        displayName: typeof data.displayName === 'string' ? data.displayName.trim() || null : data.displayName,
        bio: typeof data.bio === 'string' ? data.bio.trim() || null : data.bio,
        avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl.trim() || null : data.avatarUrl,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save profile';
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
