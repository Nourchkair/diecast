import { NextResponse } from 'next/server';
import { ensureUploadRoot, publicUploadPath, uploadRoot } from '@/lib/storage';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import path from 'path';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

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

  await ensureUploadRoot();
  const ext = path.extname(file.name || '').slice(0, 8) || (file.type?.split('/')[1] ? `.${file.type.split('/')[1]}` : '.bin');
  const filename = `${Date.now()}-${randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadRoot, filename), bytes);

  return NextResponse.json({ filePath: publicUploadPath(filename), mimeType: file.type, fileName: file.name });
}
