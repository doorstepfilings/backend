export type DatabaseConnectionConfig = {
    connectionLimit: number;
    database: string;
    host: string;
    password: string;
    port: number;
    username: string;
};

type DatabaseEnvPrefix = 'DB' | 'LEGACY_DB';
type EnvLike = Record<string, string | undefined>;

const DEFAULT_CONNECTION_LIMIT = 10;
const DEFAULT_PORT = 3306;

function isProvided(value: string | undefined) {
    return value !== undefined && value.trim() !== '';
}

function readRequiredString(
    env: EnvLike,
    key: string,
    allowEmpty = false,
) {
    const value = env[key];

    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    if (!allowEmpty && value.trim() === '') {
        throw new Error(`Environment variable ${key} cannot be empty`);
    }

    return value;
}

function readOptionalNumber(
    env: EnvLike,
    key: string,
    fallback: number,
) {
    const value = env[key];

    if (value === undefined || value.trim() === '') {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw new Error(`Environment variable ${key} must be a valid number`);
    }

    return parsed;
}

function hasAnyDatabaseValue(env: EnvLike, prefix: DatabaseEnvPrefix) {
    const keys = [
        `${prefix}_HOST`,
        `${prefix}_PORT`,
        `${prefix}_USERNAME`,
        `${prefix}_PASSWORD`,
        `${prefix}_DATABASE`,
    ];

    return keys.some((key) => isProvided(env[key]));
}

function getDatabaseConfig(
    env: EnvLike,
    prefix: DatabaseEnvPrefix,
    required: boolean,
): DatabaseConnectionConfig | null {
    if (!required && !hasAnyDatabaseValue(env, prefix)) {
        return null;
    }

    return {
        connectionLimit: readOptionalNumber(
            env,
            'DB_CONNECTION_LIMIT',
            DEFAULT_CONNECTION_LIMIT,
        ),
        database: readRequiredString(env, `${prefix}_DATABASE`),
        host: readRequiredString(env, `${prefix}_HOST`),
        password: readRequiredString(env, `${prefix}_PASSWORD`, true),
        port: readOptionalNumber(env, `${prefix}_PORT`, DEFAULT_PORT),
        username: readRequiredString(env, `${prefix}_USERNAME`),
    };
}

export function getPrimaryDatabaseConfig(
    env: EnvLike = process.env,
) {
    return getDatabaseConfig(env, 'DB', true)!;
}

export function getLegacyDatabaseConfig(
    env: EnvLike = process.env,
) {
    return getDatabaseConfig(env, 'LEGACY_DB', false);
}

export function buildMysqlConnectionUrl(
    config: Pick<
        DatabaseConnectionConfig,
        'database' | 'host' | 'password' | 'port' | 'username'
    >,
) {
    const url = new URL('mysql://localhost');

    url.username = config.username;
    url.password = config.password;
    url.hostname = config.host;
    url.port = String(config.port);
    url.pathname = `/${config.database}`;

    return url.toString();
}

export function getPrismaDatabaseUrl(
    env: EnvLike = process.env,
) {
    return buildMysqlConnectionUrl(getPrimaryDatabaseConfig(env));
}

export function describeDatabaseConnection(
    config: Pick<DatabaseConnectionConfig, 'database' | 'host' | 'port' | 'username'>,
) {
    return `${config.username}@${config.host}:${config.port}/${config.database}`;
}

export function assertDifferentDatabases(
    primary: Pick<DatabaseConnectionConfig, 'database' | 'host' | 'port' | 'username'>,
    legacy: Pick<DatabaseConnectionConfig, 'database' | 'host' | 'port' | 'username'>,
) {
    if (
        primary.host === legacy.host &&
        primary.port === legacy.port &&
        primary.database === legacy.database &&
        primary.username === legacy.username
    ) {
        throw new Error(
            'Primary DB_* and LEGACY_DB_* point to the same database. Use a fresh Prisma-managed target database before running the migration.',
        );
    }
}
