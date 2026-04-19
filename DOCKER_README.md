# MechDash — Docker Installation Guide

A mechanic dashboard for tracking repair orders, hours, earnings, and paychecks.
This package runs on your own machine or server using **Docker**.

---

## 📋 What You Need

Before you begin, install **Docker Desktop** on your machine:

- **Windows / Mac:** Download from https://www.docker.com/products/docker-desktop/
- **Linux:** Follow https://docs.docker.com/engine/install/

Make sure Docker is running before continuing.

---

## 🚀 Quick Start (3 Steps)

### 1. Unzip the Package

Unzip `mechdash-docker.zip` to any folder. Open a terminal in that folder:

```bash
cd path/to/mechdash-docker
```

### 2. Create Your `.env` File

```bash
# Mac/Linux:
cp .env.example .env

# Windows (PowerShell):
copy .env.example .env
```

Open `.env` in a text editor and update these values:

| Variable | What to Do |
|----------|-----------|
| `DB_PASSWORD` | Set to a strong password |
| `NEXTAUTH_SECRET` | Generate a random string (command below) |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Your admin login password |

**Generate a random NEXTAUTH_SECRET:**

```bash
# Mac/Linux:
openssl rand -base64 32

# Windows (PowerShell):
[Convert]::ToBase64String((1..32 | %{[byte](Get-Random -Max 256)}))
```

### 3. Build and Start

```bash
docker compose up -d --build
```

First run takes 3-5 minutes (downloads PostgreSQL + builds app). Watch logs:

```bash
docker compose logs -f app
```

Once you see `Starting MechDash server on 0.0.0.0:3000`, open:

👉 **http://localhost:3000**

Log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

---

## 🎛️ Common Commands

```bash
# View live logs
docker compose logs -f app

# Stop (keeps your data)
docker compose stop

# Start again
docker compose start

# Stop and remove containers (keeps your data)
docker compose down

# Check status
docker compose ps

# Rebuild after code changes
docker compose up -d --build

# Wipe everything (⚠️ deletes all data)
docker compose down -v
```

---

## 💾 Data & Backups

Your data is in a Docker volume `mechdash-db-data`. It persists across container restarts.

### Backup

```bash
docker compose exec db pg_dump -U mechdash mechdash > backup.sql
```

### Restore

```bash
cat backup.sql | docker compose exec -T db psql -U mechdash mechdash
```

---

## 🌐 Running on a Public Server

1. Point your domain to your server (DNS A record).
2. Edit `.env`: set `NEXTAUTH_URL=https://yourdomain.com`.
3. Use a reverse proxy (Nginx or Caddy) for HTTPS.

### Nginx

```nginx
server {
    server_name mechdash.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 80;
}
```

Then `sudo certbot --nginx -d mechdash.yourdomain.com` for HTTPS.

### Caddy (simpler — auto HTTPS!)

```
mechdash.yourdomain.com {
    reverse_proxy localhost:3000
}
```

---

## 🔧 Troubleshooting

**"Can't reach database server at `<random>:5432`"**

Your `DB_PASSWORD` in `.env` contains a special character that breaks URL parsing. Use **only letters and numbers** (no `@`, `:`, `/`, `?`, `#`, `=`, `&`). Then:
```bash
docker compose down -v      # ⚠️ wipes data
docker compose up -d --build
```

**ERR_EMPTY_RESPONSE / Can't access localhost:3000**

Check the app logs:
```bash
docker compose logs app
```

If the app isn't running:
```bash
docker compose ps
docker compose up -d --build
```

Make sure `docker compose ps` shows both `mechdash-app` and `mechdash-db` as running.

**"Port 3000 is already in use"**

Edit `docker-compose.yml`, change `"3000:3000"` to `"8080:3000"`, then use http://localhost:8080.

**Database connection errors**

Check DB logs: `docker compose logs db`. Make sure `DB_PASSWORD` has no special characters that need escaping.

**Full reset after config changes**

```bash
docker compose down -v   # ⚠️ DELETES data
docker compose up -d --build
```

**Can't log in after changing ADMIN_EMAIL**

The admin user is only created on the first startup. To reset:
```bash
docker compose down -v
docker compose up -d --build
```
(This wipes the database.)

**PDF export shows an error**

PDF export uses an external AI service. It's optional — CSV export works without it.
To enable it, set `ABACUSAI_API_KEY` in `.env` with a key from https://abacus.ai/.

---

## 📦 Package Contents

```
mechdash-docker/
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # App + PostgreSQL orchestration
├── docker-entrypoint.sh    # Runs migrations and admin-user seed
├── .dockerignore           # Excludes dev files from build
├── .env.example            # Environment template
├── DOCKER_README.md        # This file
├── app/                    # Next.js app code
├── components/             # React components
├── lib/                    # Helpers
├── prisma/                 # Database schema
├── public/                 # Static assets
├── scripts/                # Seed scripts
├── next.config.js          # Next.js config
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

---

## 🆘 Support

Built with Next.js 14, PostgreSQL 16, Prisma, and NextAuth.

For issues, check logs: `docker compose logs app`.

Happy wrenching! 🔧
