import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDefaultRate(userId: string) {
  const existingRateCount = await prisma.hourlyRate.count({ where: { userId } });
  if (existingRateCount > 0) {
    return;
  }

  await prisma.hourlyRate.create({
    data: {
      userId,
      rate: 45.0,
      effectiveFrom: new Date('2025-01-01T12:00:00.000Z'),
      effectiveTo: null,
      description: 'Standard rate',
    },
  });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mechdash.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    await seedDefaultRate(existing.id);
    console.log(`Admin user already exists: ${adminEmail}`);
    console.log('Default admin hourly rate ensured');
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      name: 'Admin',
      firstName: 'Admin',
      username: 'admin',
      role: 'admin',
      isActive: true,
    },
  });

  await seedDefaultRate(admin.id);

  console.log(`Created admin user: ${adminEmail}`);
  console.log('Default admin hourly rate created');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
