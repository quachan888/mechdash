# MechDash

MechDash is a personal dashboard for automotive mechanics who use Tekmetric during the workday and want a clearer way to track repair orders, billed hours, earnings, and paychecks.

The basic workflow is simple:

1. Export repair order data from Tekmetric.
2. Upload the CSV into MechDash.
3. Review your work history, hours, vehicles, jobs, and earnings.
4. Track paychecks and compare paid hours against completed work.

I built this app for mechanics who want their own searchable record of what they did, how many hours they flagged, and how that lines up with their pay.

## Features

- Tekmetric CSV upload for repair order history
- Repair order records with job-line details
- Dashboard summaries for hours, earnings, makes, models, and completed work
- Hourly rate history with editable effective date ranges
- Earned pay calculated automatically from the RO date and the matching hourly rate
- Paycheck tracker for comparing paid hours and earnings
- CSV and PDF export tools
- Backup and restore for moving data between installs
- Admin user management
- Docker setup with PostgreSQL included

## Why MechDash?

Tekmetric is great for shop workflow, but mechanics often need a personal view of their own production:

- What did I work on this week?
- How many billed hours did I complete?
- Which repair orders contributed to my paycheck?
- Does my paycheck match the work I flagged?
- How much did I earn under the rate that was active on that RO date?

MechDash focuses on that mechanic-first view.

## Tech Stack

- Next.js 14
- React
- TypeScript
- PostgreSQL
- Prisma
- NextAuth
- Tailwind CSS
- Docker Compose

## Quick Start With Docker

Make sure Docker Desktop is running, then clone the repo and create an environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
copy .env.example .env
```

Edit `.env` and set at least:

- `DB_PASSWORD`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Then build and start:

```bash
docker compose up --build
```

Open the app:

```text
http://localhost:3000
```

Log in with the admin email and password from your `.env`.

For more detailed Docker instructions, see [DOCKER_README.md](./DOCKER_README.md).

## Default Hourly Rate

New users start with one default hourly rate:

```text
$45.00/hr
Standard rate
Effective from 01/01/2025
```

Users can edit the hourly rate and effective date range in Settings. Records calculate earned pay from the RO completed date and the rate that was active on that date.

## Tekmetric Import Workflow

1. Export your repair order report from Tekmetric as CSV.
2. Open MechDash.
3. Go to Upload.
4. Paste or upload the exported CSV data.
5. Review imported records in Records and Dashboard.

MechDash stores the repair order and job-line details, then calculates earnings using your hourly rate history.

## Development

Install dependencies:

```bash
npm install --legacy-peer-deps
```

Run the development server:

```bash
npm run dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Push the schema to the database:

```bash
npx prisma db push
```

Seed the admin user:

```bash
npx prisma db seed
```

## Useful Commands

```bash
# Build production app
npm run build

# Start production app
npm start

# Run lint
npm run lint

# Start Docker stack
docker compose up --build

# Stop Docker stack
docker compose down

# Reset Docker database volume
docker compose down -v
```

## Data Notes

Earned pay is calculated, not manually entered. The app uses:

```text
job billed hours * hourly rate active on the RO completed date
```

That means if a user updates an hourly rate date range, the Records table reflects the corrected earned amount automatically.

## Disclaimer

MechDash is an independent personal tracking tool. It is not affiliated with, endorsed by, or sponsored by Tekmetric.
