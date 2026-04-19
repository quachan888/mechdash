#!/bin/sh
# Don't use `set -e` — we want the server to start even if seed has a hiccup

echo "========================================="
echo "MechDash - Starting up..."
echo "========================================="

# Build DATABASE_URL from individual components (handles special chars in password via URL encoding)
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-mechdash}"
DB_PASSWORD_RAW="${DB_PASSWORD:-MySecurePassword123}"
DB_NAME="${DB_NAME:-mechdash}"

# URL-encode the password using Node (handles all special characters properly)
DB_PASSWORD_ENCODED=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$DB_PASSWORD_RAW")

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
echo "✓ DATABASE_URL constructed (host=${DB_HOST}, db=${DB_NAME})"

# Wait for the database to be ready
echo "Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT 1\`.then(() => { process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; then
    echo "✓ Database is ready"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "  Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo "WARNING: Database not reachable after $MAX_RETRIES attempts. Starting server anyway..."
fi

# Apply database schema
echo "Applying database schema..."
npx prisma db push --skip-generate || echo "WARNING: prisma db push failed, but continuing..."

# Seed initial admin user if database is empty
echo "Checking if database needs seeding..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(async (count) => {
  if (count === 0) {
    console.log('No users found. Seeding initial admin user...');
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123456', 10);
    const user = await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@mechdash.local',
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
        userId: user.id,
        rate: 20.0,
        effectiveFrom: new Date('2020-01-01'),
        description: 'Default rate',
      },
    });
    console.log('✓ Admin user created: ' + (process.env.ADMIN_EMAIL || 'admin@mechdash.local'));
  } else {
    console.log('✓ Database already has ' + count + ' user(s), skipping seed.');
  }
  await prisma.\$disconnect();
}).catch(err => {
  console.error('Seed warning:', err.message);
});
" || echo "WARNING: Seeding failed, but continuing..."

echo "========================================="
echo "Starting MechDash server on 0.0.0.0:3000"
echo "========================================="

exec "$@"
