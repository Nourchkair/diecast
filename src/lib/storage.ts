import path from 'path';
import { mkdir } from 'fs/promises';

export const uploadRoot = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadRoot() {
  await mkdir(uploadRoot, { recursive: true });
}

export function publicUploadPath(filename: string) {
  return `/uploads/${filename}`;
}
