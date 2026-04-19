export interface ParsedVehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
}

const KNOWN_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Buick',
  'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford',
  'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia',
  'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda',
  'McLaren', 'Mercedes-Benz', 'Mercedes', 'Mini', 'Mitsubishi', 'Nissan',
  'Porsche', 'Ram', 'Rivian', 'Rolls-Royce', 'Subaru', 'Tesla', 'Toyota',
  'Volkswagen', 'Volvo', 'Pontiac', 'Saturn', 'Saab', 'Suzuki', 'Scion',
  'Hummer', 'Isuzu', 'Mercury', 'Oldsmobile', 'Plymouth', 'Polestar'
];

export function parseVehicleDescription(desc: string | null | undefined): ParsedVehicle {
  if (!desc?.trim?.()) return { year: null, make: null, model: null, trim: null };
  
  const parts = desc.trim().split(/\s+/);
  let year: number | null = null;
  let make: string | null = null;
  let model: string | null = null;
  let trim: string | null = null;
  let startIdx = 0;

  // Extract year
  if (parts?.[0] && /^\d{4}$/.test(parts[0])) {
    const y = parseInt(parts[0], 10);
    if (y >= 1900 && y <= 2030) {
      year = y;
      startIdx = 1;
    }
  }

  const remaining = parts.slice(startIdx);
  if (remaining?.length === 0) return { year, make, model, trim };

  // Try to match known make (could be 2 words like "Land Rover")
  const twoWordMake = remaining.slice(0, 2).join(' ');
  const oneWordMake = remaining[0] ?? '';
  
  if (remaining.length >= 2 && KNOWN_MAKES.some((m: string) => m.toLowerCase() === twoWordMake.toLowerCase())) {
    make = KNOWN_MAKES.find((m: string) => m.toLowerCase() === twoWordMake.toLowerCase()) ?? twoWordMake;
    const afterMake = remaining.slice(2);
    model = afterMake?.[0] ?? null;
    trim = afterMake.length > 1 ? afterMake.slice(1).join(' ') : null;
  } else if (KNOWN_MAKES.some((m: string) => m.toLowerCase() === oneWordMake.toLowerCase())) {
    make = KNOWN_MAKES.find((m: string) => m.toLowerCase() === oneWordMake.toLowerCase()) ?? oneWordMake;
    const afterMake = remaining.slice(1);
    model = afterMake?.[0] ?? null;
    trim = afterMake.length > 1 ? afterMake.slice(1).join(' ') : null;
  } else {
    // Unknown make - take first word as make
    make = remaining[0] ?? null;
    const afterMake = remaining.slice(1);
    model = afterMake?.[0] ?? null;
    trim = afterMake.length > 1 ? afterMake.slice(1).join(' ') : null;
  }

  return { year, make, model, trim };
}
