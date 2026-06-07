# Doorstep Backend

NestJS backend workspace for the Doorstep platform.

Current focus:
- run the live backend for the Next.js frontend
- keep the codebase organized by bounded context
- use MySQL through Prisma with production-ready environment validation

Local setup:

```bash
cp .env.example .env
npm install
npm run install:browsers        # download Playwright Chromium (one-time per machine)
npx prisma migrate dev --name init
npm run start:dev
```

## PDF / Browser Setup

PDF generation (invoices, email attachments) uses **Playwright Chromium** — a self-contained browser bundled with the package. It does **not** require Chrome, Chromium, or any other browser installed on the host machine.

### Local development (Windows / macOS / Linux)

```bash
npm install
npm run install:browsers        # downloads Playwright's bundled Chromium (~130 MB, one-time)
npm run start:dev
```

### Linux VPS / Production

```bash
git pull
npm install
npm run install:browsers        # downloads Playwright Chromium
npm run install:browsers:deps   # installs required Linux system libraries (apt-based, one-time)
npm run build
pm2 restart doorstep-backend    # or: npm run start:prod
```

> **Note:** `npm run install:browsers` must be run once on every fresh server or CI/CD environment after `npm install`. Playwright caches the browser in `~/.cache/ms-playwright` and does not re-download unless the cache is cleared.

> **Linux system libs:** If PDF generation fails on Linux with a `libgbm` or `libnss3` error, run `npm run install:browsers:deps` once to install the required OS packages automatically.

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run seed:dev
npm run migrate:legacy
npm run migrate:verify
```

Runtime:
- API base URL: `http://127.0.0.1:4000/api`
- Health check: `GET /api/health`
- Database: MySQL with Prisma

Prisma migration workflow:

```bash
# local development
npx prisma migrate dev --name <change-name>

# staging/production
npx prisma migrate deploy
```

Fresh Prisma-managed database rollout:

```text
DB_*         -> fresh NestJS/Prisma database (example: doorstep_nest)
LEGACY_DB_*  -> existing Laravel database (example: doorstepfilings)
```

Typical migration flow:

```bash
# 1. point DB_* at the fresh target database
# 2. point LEGACY_DB_* at the existing Laravel database
npx prisma migrate deploy
npm run migrate:legacy
npm run migrate:verify
```

If legacy uploaded files remain on the Laravel server during phase 1, set `LEGACY_STORAGE_ROOTS` so NestJS can continue serving them while the database cutover stabilizes.

Architecture:
- `src/modules/*`: bounded contexts
- `src/modules/*/application`: orchestration and use-case services
- `src/modules/*/domain`: route maps and domain-level definitions
- `src/modules/*/presentation`: HTTP-facing controllers
- `src/config/*`: environment and runtime configuration
- `src/shared/*`: shared HTTP helpers and cross-cutting utilities
