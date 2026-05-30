const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const mysql = require('mysql2/promise');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_ENTRY = path.join(PROJECT_ROOT, 'dist', 'src', 'main.js');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'prisma', 'migrations');
const PRISMA_CLI_ENTRY = path.join(
  PROJECT_ROOT,
  'node_modules',
  'prisma',
  'build',
  'index.js',
);
const MIGRATION_POLL_INTERVAL_MS = 2000;
const MIGRATION_WAIT_TIMEOUT_MS = 120000;

function log(message) {
  console.log(`[startup] ${message}`);
}

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function getLatestLocalMigrationName() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return null;
  }

  const migrationNames = fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return migrationNames.at(-1) ?? null;
}

function getPm2InstanceId() {
  const rawValue = process.env.NODE_APP_INSTANCE;

  if (rawValue === undefined) {
    return null;
  }

  const parsed = Number(rawValue);

  return Number.isInteger(parsed) ? parsed : null;
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function runPrismaMigrateDeploy() {
  if (!fs.existsSync(PRISMA_CLI_ENTRY)) {
    throw new Error(
      `Prisma CLI entry not found at ${PRISMA_CLI_ENTRY}. Run npm install first.`,
    );
  }

  const result = spawnSync(
    process.execPath,
    [PRISMA_CLI_ENTRY, 'migrate', 'deploy', '--config', 'prisma.config.ts'],
    {
      cwd: PROJECT_ROOT,
      env: process.env,
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `Prisma migrate deploy exited with status ${result.status ?? 'unknown'}`,
    );
  }
}

async function waitForLatestMigration(migrationName) {
  const deadline = Date.now() + MIGRATION_WAIT_TIMEOUT_MS;
  let lastErrorMessage = '';

  while (Date.now() < deadline) {
    let connection;

    try {
      connection = await mysql.createConnection({
        host: getRequiredEnv('DB_HOST'),
        port: Number(process.env.DB_PORT || 3306),
        user: getRequiredEnv('DB_USERNAME'),
        password: process.env.DB_PASSWORD ?? '',
        database: getRequiredEnv('DB_DATABASE'),
      });

      const [rows] = await connection.execute(
        `
          SELECT finished_at AS finishedAt, rolled_back_at AS rolledBackAt
          FROM _prisma_migrations
          WHERE migration_name = ?
          ORDER BY started_at DESC
          LIMIT 1
        `,
        [migrationName],
      );
      const row = Array.isArray(rows) ? rows[0] : null;

      if (row?.finishedAt && !row?.rolledBackAt) {
        return;
      }
    } catch (error) {
      lastErrorMessage =
        error instanceof Error ? error.message : String(error);
    } finally {
      if (connection) {
        await connection.end();
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, MIGRATION_POLL_INTERVAL_MS),
    );
  }

  const suffix = lastErrorMessage ? ` Last error: ${lastErrorMessage}` : '';

  throw new Error(
    `Timed out waiting for Prisma migration ${migrationName} to finish.${suffix}`,
  );
}

function startApplication() {
  if (!fs.existsSync(DIST_ENTRY)) {
    throw new Error(
      `Built app entry not found at ${DIST_ENTRY}. Run npm run build first.`,
    );
  }

  require(DIST_ENTRY);
}

async function main() {
  loadDotEnvFile(path.join(PROJECT_ROOT, '.env'));

  const latestMigrationName = getLatestLocalMigrationName();
  const pm2InstanceId = getPm2InstanceId();
  const migrateOnly = process.argv.includes('--migrate-only');

  if (latestMigrationName) {
    if (pm2InstanceId === null || pm2InstanceId === 0) {
      log(`Applying pending Prisma migrations before app startup.`);
      runPrismaMigrateDeploy();
    } else {
      log(
        `Waiting for Prisma migration ${latestMigrationName} to be applied before app startup.`,
      );
      await waitForLatestMigration(latestMigrationName);
      log(`Detected Prisma migration ${latestMigrationName}.`);
    }
  } else {
    log('No local Prisma migrations found. Starting app without migration step.');
  }

  if (migrateOnly) {
    log('Migration-only mode complete.');
    return;
  }

  startApplication();
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : error;
  console.error(`[startup] ${message}`);
  process.exit(1);
});
