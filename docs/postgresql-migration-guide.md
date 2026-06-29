# PostgreSQL Migration Guide

This project uses PostgreSQL as the main NestJS/Prisma database.

Use these environment variable groups carefully:

```text
DB_*         = main PostgreSQL database used by the NestJS app
LEGACY_DB_*  = old MySQL database used only when running legacy migration
```

## 1. Install PostgreSQL On Server

Run as `root` or with `sudo`:

```bash
apt update
apt install postgresql postgresql-contrib -y
systemctl enable --now postgresql
systemctl status postgresql
```

On Ubuntu, `postgresql.service` may show `active (exited)`. That is normal for the parent PostgreSQL service.

## 2. Create PostgreSQL User And Database

Open the PostgreSQL shell:

```bash
sudo -u postgres psql
```

Create the project database and user:

```sql
CREATE USER doorstepfilings WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE nest_doorstep_main OWNER doorstepfilings;
GRANT ALL PRIVILEGES ON DATABASE nest_doorstep_main TO doorstepfilings;

\c nest_doorstep_main

GRANT ALL ON SCHEMA public TO doorstepfilings;
ALTER SCHEMA public OWNER TO doorstepfilings;

\q
```

Test login:

```bash
psql "postgresql://doorstepfilings:your_strong_password_here@127.0.0.1:5432/nest_doorstep_main" -c "SELECT current_database(), current_user;"
```

## 3. Server `.env` For PostgreSQL

Set the main database values in the backend project `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nest_doorstep_main
DB_USERNAME=doorstepfilings
DB_PASSWORD=your_strong_password_here
```

If you will migrate directly from the old MySQL database on the server, also set:

```env
LEGACY_DB_HOST=127.0.0.1
LEGACY_DB_PORT=3306
LEGACY_DB_DATABASE=your_old_mysql_database
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=your_mysql_password
```

Do not point `DB_*` and `LEGACY_DB_*` to the same database. `DB_*` must be PostgreSQL, and `LEGACY_DB_*` must be MySQL.

## 4. Option A: Migrate MySQL To PostgreSQL On Server

Use this if the old MySQL database is already on the server.

Go to the backend project folder:

```bash
cd /path/to/doorstepfilings-backend
```

Install dependencies and create PostgreSQL tables:

```bash
npm install
npx prisma migrate deploy
```

Copy MySQL data into PostgreSQL:

```bash
npm run migrate:legacy
npm run migrate:verify
```

Build and restart the app:

```bash
npm run build
pm2 restart doorstep-backend
```

## 5. Option B: Import Already Migrated Local PostgreSQL To Server

Use this if you already migrated and verified the database locally.

On local machine, export the local PostgreSQL database:

```powershell
pg_dump -h localhost -p 5432 -U postgres -d nest_doorstep_main -Fc -f doorstep_backup.dump
```

Upload the dump to server:

```powershell
scp doorstep_backup.dump root@SERVER_IP:/tmp/doorstep_backup.dump
```

On the server, restore into PostgreSQL:

```bash
pg_restore -U doorstepfilings -d nest_doorstep_main --clean --if-exists --no-owner --no-acl /tmp/doorstep_backup.dump
```

Then build and restart:

```bash
npm run build
pm2 restart doorstep-backend
```

## 6. Check PostgreSQL Data

Open the project database:

```bash
psql "postgresql://doorstepfilings:your_strong_password_here@127.0.0.1:5432/nest_doorstep_main"
```

Useful PostgreSQL commands:

```sql
\l
\dt
\d users
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM services;
SELECT COUNT(*) FROM user_services;
SELECT COUNT(*) FROM payments;
\q
```

## 7. Recommended Path

If the local PostgreSQL database is already migrated and verified, use Option B:

```text
local pg_dump -> upload dump -> server pg_restore -> restart app
```

If the server has the original MySQL database and you want the server to perform the migration, use Option A:

```text
set DB_* PostgreSQL -> set LEGACY_DB_* MySQL -> prisma migrate deploy -> migrate:legacy -> migrate:verify
```

