#!/bin/sh
# Do not use `set -e`; the server should still start if seed has a hiccup.

echo "========================================="
echo "MechDash - Starting up..."
echo "========================================="

# Build DATABASE_URL from individual components.
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mechdash}"
DB_PASSWORD_RAW="${DB_PASSWORD:-MySecurePassword123}"
DB_NAME="${DB_NAME:-mechdash}"

# URL-encode the password using Node.
DB_PASSWORD_ENCODED=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$DB_PASSWORD_RAW")

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
echo "DATABASE_URL constructed (host=${DB_HOST}, db=${DB_NAME})"

echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT 1\`.then(() => { process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    echo "Database is ready"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "  Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "WARNING: Database not reachable after $MAX_RETRIES attempts. Starting server anyway..."
fi

echo "Applying database schema..."
npx prisma db push --skip-generate || echo "WARNING: prisma db push failed, but continuing..."

echo "Checking if database needs seeding..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDefaultRate(userId) {
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
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existingAdmin) {
    await seedDefaultRate(existingAdmin.id);
    console.log('Admin user already exists: ' + adminEmail);
    console.log('Default admin hourly rate ensured.');
    return;
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('No users found. Seeding initial admin user...');
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.create({
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

    await seedDefaultRate(user.id);
    console.log('Admin user created: ' + adminEmail);
    console.log('Default admin hourly rate created.');
  } else {
    console.log('Database already has ' + userCount + ' user(s), skipping admin user seed.');
  }
}

main()
  .catch((err) => {
    console.error('Seed warning:', err.message);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
" || echo "WARNING: Seeding failed, but continuing..."

echo "========================================="
echo "Starting MechDash server on 0.0.0.0:3000"
echo "========================================="

exec "$@"
