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
npx prisma migrate dev --name init
npm run start:dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run migrate:deploy
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

Production bootstrap:
- `npm run start:prod` runs `prisma migrate deploy` before loading `dist/src/main`.
- PM2 uses the same bootstrap script, and non-primary cluster workers wait until the latest local migration is present in `_prisma_migrations` before starting the app.

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
