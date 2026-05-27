import { PrismaClient, Condition, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.tag.count();
  if (count > 0) return;

  await prisma.tag.createMany({
    data: [
      { name: 'JDM', color: '#f97316' },
      { name: 'muscle', color: '#ef4444' },
      { name: 'supercar', color: '#8b5cf6' },
      { name: 'chase', color: '#f59e0b' },
      { name: 'premium', color: '#0ea5e9' },
      { name: 'fantasy', color: '#14b8a6' },
    ],
  });

  await prisma.diecastItem.createMany({
    data: [
      {
        displayName: '2023 Hot Wheels Nissan Skyline GT-R',
        brand: 'Hot Wheels',
        make: 'Nissan',
        model: 'Skyline GT-R',
        year: 2023,
        scale: '1:64',
        series: 'Car Culture',
        vehicleType: VehicleType.JDM,
        color: 'Blue',
        variant: 'Mainline',
        productCode: 'HXY12',
        barcode: '887961961081',
        condition: Condition.NEAR_MINT,
        quantityOwned: 1,
        rarityScore: 32,
      },
      {
        displayName: 'Matchbox 2022 Toyota Supra',
        brand: 'Matchbox',
        make: 'Toyota',
        model: 'Supra',
        year: 2022,
        scale: '1:64',
        series: 'Collectors',
        vehicleType: VehicleType.JDM,
        color: 'White',
        variant: 'Premium',
        productCode: 'MBX-9001',
        barcode: '887961451234',
        condition: Condition.MINT,
        quantityOwned: 2,
        rarityScore: 20,
      },
      {
        displayName: 'Hot Wheels 1969 Dodge Charger',
        brand: 'Hot Wheels',
        make: 'Dodge',
        model: 'Charger',
        year: 1969,
        scale: '1:64',
        series: 'Boulevard',
        vehicleType: VehicleType.MUSCLE,
        color: 'Black',
        variant: 'Premium',
        productCode: 'HBL-1969',
        condition: Condition.MINT,
        quantityOwned: 1,
        rarityScore: 44,
      },
    ],
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
