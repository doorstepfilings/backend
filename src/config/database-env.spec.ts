import {
    assertDifferentDatabases,
    buildPostgresConnectionUrl,
    getLegacyDatabaseConfig,
    getPrimaryDatabaseConfig,
} from './database-env';

describe('database-env', () => {
    it('builds a postgres url from DB-style variables', () => {
        const url = buildPostgresConnectionUrl({
            database: 'doorstep_nest',
            host: '127.0.0.1',
            password: '',
            port: 5432,
            username: 'root',
        });

        expect(url).toBe('postgresql://root@127.0.0.1:5432/doorstep_nest');
    });

    it('returns null when no legacy database config is provided', () => {
        expect(getLegacyDatabaseConfig({})).toBeNull();
    });

    it('reads the primary database config from DB variables', () => {
        expect(
            getPrimaryDatabaseConfig({
                DB_DATABASE: 'doorstep_nest',
                DB_HOST: '127.0.0.1',
                DB_PASSWORD: '',
                DB_PORT: '5432',
                DB_USERNAME: 'root',
            }),
        ).toEqual({
            connectionLimit: 10,
            database: 'doorstep_nest',
            host: '127.0.0.1',
            password: '',
            port: 5432,
            username: 'root',
        });
    });

    it('rejects using the same database for target and legacy migration', () => {
        expect(() =>
            assertDifferentDatabases(
                {
                    database: 'doorstepfilings',
                    host: '127.0.0.1',
                    port: 3306,
                    username: 'root',
                },
                {
                    database: 'doorstepfilings',
                    host: '127.0.0.1',
                    port: 3306,
                    username: 'root',
                },
            ),
        ).toThrow(/same database/i);
    });
});
