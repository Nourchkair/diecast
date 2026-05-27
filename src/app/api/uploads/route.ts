import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import path from 'path';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { imageBucket } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const ext = path.extname(file.name || '').slice(0, 8) || (file.type?.split('/')[1] ? `.${file.type.split('/')[1]}` : '.bin');
  const objectPath = `${user.id}/${Date.now()}-${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(imageBucket).upload(objectPath, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = supabase.storage.from(imageBucket).getPublicUrl(objectPath);

  return NextResponse.json({ filePath: data.publicUrl, mimeType: file.type, fileName: file.name });
}
