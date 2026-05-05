# Doorstep Backend

NestJS backend workspace for the Doorstep platform.

Current focus:
- run the live backend for the Next.js frontend
- keep the codebase organized by bounded context
- use MySQL through TypeORM with production-ready environment validation

Local setup:

```bash
cp .env.example .env
npm install
npm run start:dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Runtime:
- API base URL: `http://127.0.0.1:4000/api`
- Health check: `GET /api/health`
- Database: MySQL

Architecture:
- `src/modules/*`: bounded contexts
- `src/modules/*/application`: orchestration and use-case services
- `src/modules/*/domain`: route maps and domain-level definitions
- `src/modules/*/presentation`: HTTP-facing controllers
- `src/config/*`: environment and runtime configuration
- `src/shared/*`: shared HTTP helpers and cross-cutting utilities
