import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mechdash.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
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

  await prisma.hourlyRate.create({
    data: {
      userId: admin.id,
      rate: 45.0,
      effectiveFrom: new Date('2020-01-01'),
      description: 'Default rate',
    },
  });

  console.log(`✓ Created admin user: ${adminEmail}`);
  console.log(`✓ Default hourly rate created: $45/hr`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
