import { Authzkit } from '../src/classes/Authzkit';
import { PgConnection } from '../src/drivers/postgres/pg-connection';
import { newDb } from 'pg-mem';
import { PgAuthzkitStore } from '../src/stores/PgAuthzkitStore';
import { IAuthzkitConfig } from '../src/interfaces/IAuthzkitConfig';

// Increase Jest timeout
jest.setTimeout(30000);

describe('PgAuthzkitStore (Custom Tables)', () => {
  let pgMemDb: any;
  let pgConnection: PgConnection;
  let pgAuthzkitStore: PgAuthzkitStore;
  let authzkit: Authzkit;

  const CONNECTION_STRING = 'in-memory-db-custom';

  beforeAll(async () => {
    pgMemDb = newDb();

    // We need to initialize schema with custom names
    const config: IAuthzkitConfig = {
      connection: {
        type: 'postgres',
        uri: CONNECTION_STRING,
      },
      models: {
        users: 'custom_users',
        roles: 'custom_roles',
        permissions: 'custom_permissions',
        user_roles: 'custom_user_roles',
        user_permissions: 'custom_user_permissions',
      },
    };

    pgConnection = PgConnection.getInstance(config, pgMemDb);
    await pgConnection.initSchema();
  });

  beforeEach(async () => {
    // Config matching the one used in beforeAll (for singleton to return same instance)
    // Actually, if we pass same config object (by value/content), getInstance should return same instance.
    // But we used random string in other test. Here we can stick to one instance since we just want to verify table names.
    // Or we can create a new instance if we want, but we need to pass pgMemDb again.

    const config: IAuthzkitConfig = {
      connection: {
        type: 'postgres',
        uri: CONNECTION_STRING,
      },
      models: {
        users: 'custom_users',
        roles: 'custom_roles',
        permissions: 'custom_permissions',
        user_roles: 'custom_user_roles',
        user_permissions: 'custom_user_permissions',
      },
    };

    // We reuse the instance created in beforeAll
    pgConnection = PgConnection.getInstance(config, pgMemDb);
    pgAuthzkitStore = new PgAuthzkitStore(pgConnection);
    Authzkit.getInstance(pgAuthzkitStore);
    authzkit = Authzkit.getInstance();

    // We don't call reset() here because it might truncate tables we just created?
    // Actually reset() calls truncateTables(). PgConnection.truncateTables() uses getTableName().
    // So if config is correct, it should truncate custom tables.
    await authzkit.reset();

    await authzkit.definePermission('custom_pg_perm');
  });

  test('should store data in custom tables', async () => {
    // Query pg-mem directly to see if data is in custom table
    // pg-mem exposes the DB state via pgMemDb

    // we can use pgConnection.query acting as a backdoor too, but let's try to verify via "direct" SQL on the connection

    const res = await pgConnection.query(
      'SELECT count(*) FROM custom_permissions WHERE name = $1',
      ['custom_pg_perm']
    );
    expect(res.rows[0].count).toBe(1);

    // Verify default table does not exist or is empty
    // In pg-mem, querying non-existent table throws error.
    await expect(pgConnection.query('SELECT count(*) FROM permissions')).rejects.toThrow();
  });
});
