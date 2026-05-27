import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/migrate-to-supabase.mjs <export.json>');
  process.exit(1);
}

const remote = new PrismaClient();

function asDate(value) {
  if (!value) return value;
  return value instanceof Date ? value : new Date(value);
}

function asBool(value) {
  return Boolean(value);
}

async function ensureStorageBucket() {
  await remote.$executeRawUnsafe(`
    insert into storage.buckets (id, name, public)
    values ('diecast-images', 'diecast-images', true)
    on conflict (id) do update set name = excluded.name, public = excluded.public;
  `);

  await remote.$executeRawUnsafe(`drop policy if exists "diecast-images authenticated insert" on storage.objects;`);
  await remote.$executeRawUnsafe(`drop policy if exists "diecast-images authenticated update" on storage.objects;`);
  await remote.$executeRawUnsafe(`drop policy if exists "diecast-images authenticated delete" on storage.objects;`);
  await remote.$executeRawUnsafe(`drop policy if exists "diecast-images public read" on storage.objects;`);

  await remote.$executeRawUnsafe(`
    create policy "diecast-images authenticated insert"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'diecast-images');
  `);

  await remote.$executeRawUnsafe(`
    create policy "diecast-images authenticated update"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'diecast-images')
    with check (bucket_id = 'diecast-images');
  `);

  await remote.$executeRawUnsafe(`
    create policy "diecast-images authenticated delete"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'diecast-images');
  `);

  await remote.$executeRawUnsafe(`
    create policy "diecast-images public read"
    on storage.objects
    for select
    using (bucket_id = 'diecast-images');
  `);
}

async function main() {
  const { tags, items, images, itemTags } = JSON.parse(await readFile(inputPath, 'utf8'));

  await ensureStorageBucket();

  await remote.$transaction([
    remote.itemTag.deleteMany(),
    remote.diecastImage.deleteMany(),
    remote.diecastItem.deleteMany(),
    remote.tag.deleteMany(),
  ]);

  if (tags.length) {
    await remote.tag.createMany({
      data: tags.map((tag) => ({
        id: tag.id,
        userId: tag.userId ?? null,
        name: tag.name,
        color: tag.color,
        createdAt: asDate(tag.createdAt),
        updatedAt: asDate(tag.updatedAt),
      })),
    });
  }

  if (items.length) {
    await remote.diecastItem.createMany({
      data: items.map((item) => ({
        id: item.id,
        userId: item.userId ?? null,
        displayName: item.displayName,
        brand: item.brand,
        make: item.make,
        model: item.model,
        year: item.year,
        scale: item.scale,
        series: item.series,
        vehicleType: item.vehicleType,
        color: item.color,
        variant: item.variant,
        productCode: item.productCode,
        barcode: item.barcode,
        condition: item.condition,
        quantityOwned: item.quantityOwned,
        isWishlist: asBool(item.isWishlist),
        acquiredDate: asDate(item.acquiredDate),
        acquiredFrom: item.acquiredFrom,
        storageLocation: item.storageLocation,
        notes: item.notes,
        rarityScore: item.rarityScore,
        createdAt: asDate(item.createdAt),
        updatedAt: asDate(item.updatedAt),
      })),
    });
  }

  if (images.length) {
    await remote.diecastImage.createMany({
      data: images.map((image) => ({
        id: image.id,
        itemId: image.itemId,
        filePath: image.filePath,
        mimeType: image.mimeType,
        altText: image.altText,
        isPrimary: asBool(image.isPrimary),
        createdAt: asDate(image.createdAt),
      })),
    });
  }

  if (itemTags.length) {
    await remote.itemTag.createMany({
      data: itemTags.map((link) => ({
        itemId: link.itemId,
        tagId: link.tagId,
      })),
    });
  }

  console.log(JSON.stringify({ tags: tags.length, items: items.length, images: images.length, itemTags: itemTags.length }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await remote.$disconnect();
  });
