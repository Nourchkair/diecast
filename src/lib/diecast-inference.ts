import type { VehicleType } from '@prisma/client';
import { brandOptions } from '@/lib/constants';
import { normalizeTerm, titleCase } from '@/lib/normalize';

type InferredFields = {
  brand: string;
  make: string;
  model: string;
  year: string;
  vehicleType: VehicleType;
};

type ModelHint = {
  aliases: string[];
  make: string;
  model: string;
  vehicleType: VehicleType;
};

const modelHints: ModelHint[] = [
  { aliases: ['aventador'], make: 'Lamborghini', model: 'Aventador', vehicleType: 'SUPERCAR' },
  { aliases: ['huracan'], make: 'Lamborghini', model: 'Huracan', vehicleType: 'SUPERCAR' },
  { aliases: ['countach'], make: 'Lamborghini', model: 'Countach', vehicleType: 'SUPERCAR' },
  { aliases: ['diablo'], make: 'Lamborghini', model: 'Diablo', vehicleType: 'SUPERCAR' },
  { aliases: ['gallardo'], make: 'Lamborghini', model: 'Gallardo', vehicleType: 'SUPERCAR' },
  { aliases: ['murcielago'], make: 'Lamborghini', model: 'Murcielago', vehicleType: 'SUPERCAR' },
  { aliases: ['urus'], make: 'Lamborghini', model: 'Urus', vehicleType: 'SUPERCAR' },
  { aliases: ['charger', 'daytona', 'super bee'], make: 'Dodge', model: 'Charger', vehicleType: 'MUSCLE' },
  { aliases: ['challenger', 'cuda', 'coronet'], make: 'Dodge', model: 'Challenger', vehicleType: 'MUSCLE' },
  { aliases: ['mustang', 'gt40', 'bronco'], make: 'Ford', model: 'Mustang', vehicleType: 'MUSCLE' },
  { aliases: ['camaro', 'corvette', 'chevelle', 'impala', 'bel air', 'nova', 'monte carlo', 'silverado'], make: 'Chevrolet', model: 'Camaro', vehicleType: 'MUSCLE' },
  { aliases: ['skyline', 'gtr', 'gt-r', 'silvia', 'fairlady', '240z', '280z', '350z', '370z'], make: 'Nissan', model: 'Skyline GT-R', vehicleType: 'JDM' },
  { aliases: ['supra', 'celica', 'ae86', 'corolla', '86', 'gr yaris', 'land cruiser'], make: 'Toyota', model: 'Supra', vehicleType: 'JDM' },
  { aliases: ['civic', 'nsx', 's2000', 'integra', 'crx', 'cr-x'], make: 'Honda', model: 'Civic', vehicleType: 'JDM' },
  { aliases: ['rx7', 'rx-7', 'rx8', 'rx-8', 'mx5', 'mx-5', 'miata'], make: 'Mazda', model: 'RX-7', vehicleType: 'JDM' },
  { aliases: ['impreza', 'wrx', 'sti', 'brz', 'legacy'], make: 'Subaru', model: 'Impreza WRX STI', vehicleType: 'RALLY' },
  { aliases: ['evo', 'lancer evo', 'evolution', '3000gt', 'eclipse'], make: 'Mitsubishi', model: 'Lancer Evolution', vehicleType: 'RALLY' },
  { aliases: ['911', 'gt3', 'carrera', 'cayman', 'taycan', '918', 'panamera'], make: 'Porsche', model: '911 GT3', vehicleType: 'SUPERCAR' },
  { aliases: ['f40', 'f50', 'laferrari', 'f8', '488', '296', 'sf90', '812'], make: 'Ferrari', model: 'F40', vehicleType: 'SUPERCAR' },
  { aliases: ['mclaren', 'p1', '720s', '765lt', 'artura', 'senna'], make: 'McLaren', model: '720S', vehicleType: 'SUPERCAR' },
  { aliases: ['veyron', 'chiron', 'eb110', 'bolide'], make: 'Bugatti', model: 'Chiron', vehicleType: 'SUPERCAR' },
  { aliases: ['koenigsegg', 'jesko', 'agera', 'regera'], make: 'Koenigsegg', model: 'Jesko', vehicleType: 'SUPERCAR' },
  { aliases: ['road runner', 'roadrunner', 'charger', 'challenger', 'cuda', 'gt500', 'gto', 'firebird'], make: 'Dodge', model: 'Charger', vehicleType: 'MUSCLE' },
  { aliases: ['f-150', 'f150', 'raptor', 'bronco', 'ranger'], make: 'Ford', model: 'Bronco', vehicleType: 'TRUCK' },
];

const makeVehicleType: Array<{ aliases: string[]; vehicleType: VehicleType }> = [
  { aliases: ['lamborghini', 'ferrari', 'mclaren', 'bugatti', 'koenigsegg', 'pagani', 'aston martin', 'porsche'], vehicleType: 'SUPERCAR' },
  { aliases: ['dodge', 'chevrolet', 'chevy', 'ford', 'pontiac', 'plymouth', 'buick', 'oldsmobile', 'amc', 'ram'], vehicleType: 'MUSCLE' },
  { aliases: ['nissan', 'toyota', 'honda', 'mazda', 'subaru', 'mitsubishi', 'lexus', 'acura', 'isuzu'], vehicleType: 'JDM' },
  { aliases: ['gmc', 'chevrolet silverado', 'ford f-150', 'toyota tacoma', 'toyota tundra'], vehicleType: 'TRUCK' },
];

function includesAlias(source: string, alias: string) {
  return source.includes(normalizeTerm(alias));
}

function getVehicleTypeFor(make: string, model: string, source: string): VehicleType {
  const modelHint = modelHints.find((hint) => hint.aliases.some((alias) => includesAlias(source, alias)));
  if (modelHint) return modelHint.vehicleType;

  const makeHint = makeVehicleType.find((hint) => hint.aliases.some((alias) => includesAlias(source, alias) || includesAlias(make, alias) || includesAlias(model, alias)));
  return makeHint?.vehicleType ?? 'OTHER';
}

export function inferDiecastFields(displayName: string): Partial<InferredFields> {
  const source = normalizeTerm(displayName);
  if (!source) return {};

  const year = displayName.match(/\b(19|20)\d{2}\b/)?.[0] ?? '';
  const brand = brandOptions.find((option) => includesAlias(source, option.value))?.value ?? '';
  const modelHint = modelHints.find((hint) => hint.aliases.some((alias) => includesAlias(source, alias)));

  const make = modelHint?.make ?? '';
  const model = modelHint?.model ?? '';
  const vehicleType = modelHint?.vehicleType ?? getVehicleTypeFor(make, model, source);

  if (modelHint) {
    return { brand, make, model, year, vehicleType };
  }

  const makeHint = makeVehicleType.find((hint) => hint.aliases.some((alias) => includesAlias(source, alias)));
  const inferredMake = makeHint ? titleCase(makeHint.aliases[0]) : '';
  const vehicleTypeFromMake = makeHint?.vehicleType ?? 'OTHER';
  const remainder = source
    .replace(year ? normalizeTerm(year) : '', ' ')
    .replace(normalizeTerm(brand), ' ')
    .replace(normalizeTerm(inferredMake), ' ')
    .replace(/\b(car|diecast|toy|model|limited|edition|mainline|premium)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    brand,
    make: inferredMake,
    model: remainder ? titleCase(remainder) : '',
    year,
    vehicleType: vehicleTypeFromMake,
  };
}
