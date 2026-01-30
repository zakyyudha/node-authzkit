import { Authzkit } from '../src/classes/Authzkit';
import { Authorizable } from '../src/interfaces/Authorizable';
import { PgConnection } from '../src/drivers/postgres/pg-connection';
import { newDb } from 'pg-mem';
import { PgAuthzkitStore } from '../src/stores/PgAuthzkitStore';
import { IAuthzkitConfig } from '../src/interfaces/IAuthzkitConfig';

// Increase Jest timeout for PostgreSQL operations
jest.setTimeout(30000); // 30 seconds

describe('PgAuthzkitStore', () => {
  let pgMemDb: any; // Use any because IMemoryDb doesn't have clone method directly
  let pgConnection: PgConnection;
  let pgAuthzkitStore: PgAuthzkitStore;
  let authzkit: Authzkit;
  let user: Authorizable;

  // No actual connection string needed for in-memory db
  const CONNECTION_STRING = 'in-memory-db';

  beforeAll(async () => {
    // pg-mem's newDb() method creates a fresh, isolated database instance.
    // We create one for the whole test suite as pg-mem can be reset efficiently.
    pgMemDb = newDb();

    const config: IAuthzkitConfig = {
      connection: {
        type: 'postgres',
        uri: CONNECTION_STRING,
      },
    };

    pgConnection = PgConnection.getInstance(config, pgMemDb);
    // No need to call pgConnection.connect() for pg-mem, as it's mocked
    await pgConnection.initSchema(); // Initialize schema for tests
  });

  beforeEach(async () => {
    // For pg-mem, pgMemDb.public.query('TRUNCATE ...') is the way to reset data.
    // This is handled by authzkit.reset() which calls pgAuthzkitStore.reset().
    // We need to re-initialize PgConnection for each test to ensure its internal state is clean.

    const config: IAuthzkitConfig = {
      connection: {
        type: 'postgres',
        uri: CONNECTION_STRING + Math.random(),
      },
    };

    pgConnection = PgConnection.getInstance(config, pgMemDb); // Unique connectionString for singleton instance tracking
    pgAuthzkitStore = new PgAuthzkitStore(pgConnection);
    Authzkit.getInstance(pgAuthzkitStore); // Initialize Authzkit with the Pg store
    authzkit = Authzkit.getInstance(); // Get the instance, ensure it's the one we just set
    await authzkit.reset(); // Clear all data for current test using the clean schema

    // Define some permissions and roles
    await authzkit.definePermission('create_pg_post');
    await authzkit.definePermission('edit_pg_post');
    await authzkit.definePermission('delete_pg_post');
    await authzkit.definePermission('view_pg_dashboard');

    await authzkit.defineRole('pg_admin', [
      'create_pg_post',
      'edit_pg_post',
      'delete_pg_post',
      'view_pg_dashboard',
    ]);
    await authzkit.defineRole('pg_editor', ['create_pg_post', 'edit_pg_post']);
    await authzkit.defineRole('pg_viewer', ['view_pg_dashboard']);

    user = { id: 'pg_user1', roles: [], permissions: [] }; // Using string ID
  });

  afterAll(async () => {
    // No explicit disconnect needed for pg-mem
  });

  // --- Permission Definition Tests ---
  test('should define a permission', async () => {
    const perm = await authzkit.definePermission('new_pg_permission');
    expect(perm).toEqual({ name: 'new_pg_permission', guard_name: undefined });
    await expect(authzkit.definePermission('new_pg_permission')).rejects.toThrow(
      /Permission 'new_pg_permission' already exists./
    );
  });

  // --- Role Definition Tests ---
  test('should define a role with permissions', async () => {
    const role = await authzkit.defineRole('pg_moderator', ['edit_pg_post']);
    expect(role).toEqual({
      name: 'pg_moderator',
      permissions: ['edit_pg_post'],
      guard_name: undefined,
    });
    await expect(authzkit.defineRole('pg_admin')).rejects.toThrow(
      /Role 'pg_admin' already exists./
    );
  });

  test('should throw error if role is defined with non-existent permission', async () => {
    await expect(
      authzkit.defineRole('bad_pg_role', ['non_existent_pg_permission'])
    ).rejects.toThrow(
      /Permission 'non_existent_pg_permission' not found when defining role 'bad_pg_role'./
    );
  });

  // --- Assignment Tests ---
  test('should assign a role to a user', async () => {
    await authzkit.assignRole(user, 'pg_editor');
    expect(await authzkit.hasRole(user, 'pg_editor')).toBe(true);
    expect(await authzkit.hasRole(user, 'pg_admin')).toBe(false);
  });

  test('should assign a direct permission to a user', async () => {
    await authzkit.assignPermission(user, 'create_pg_post');
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_pg_post')).toBe(false);
  });

  test('should throw error if assigning non-existent role', async () => {
    await expect(authzkit.assignRole(user, 'non_existent_pg_role')).rejects.toThrow(
      /Role 'non_existent_pg_role' not found./
    );
  });

  test('should throw error if assigning non-existent permission', async () => {
    await expect(authzkit.assignPermission(user, 'non_existent_pg_permission')).rejects.toThrow(
      /Permission 'non_existent_pg_permission' not found./
    );
  });

  // --- Revocation Tests ---
  test('should revoke a role from a user', async () => {
    await authzkit.assignRole(user, 'pg_editor');
    expect(await authzkit.hasRole(user, 'pg_editor')).toBe(true);
    await authzkit.revokeRole(user, 'pg_editor');
    expect(await authzkit.hasRole(user, 'pg_editor')).toBe(false);
  });

  test('should revoke a direct permission from a user', async () => {
    await authzkit.assignPermission(user, 'create_pg_post');
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(true);
    await authzkit.revokePermission(user, 'create_pg_post');
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(false);
  });

  // --- Has Role/Permission Tests ---
  test('user with role should have role', async () => {
    await authzkit.assignRole(user, 'pg_admin');
    expect(await authzkit.hasRole(user, 'pg_admin')).toBe(true);
  });

  test('user without role should not have role', async () => {
    expect(await authzkit.hasRole(user, 'pg_admin')).toBe(false);
  });

  test('user with direct permission should have permission', async () => {
    await authzkit.assignPermission(user, 'edit_pg_post');
    expect(await authzkit.hasPermission(user, 'edit_pg_post')).toBe(true);
  });

  test('user with role having permission should have permission', async () => {
    await authzkit.assignRole(user, 'pg_editor'); // pg_editor has create_pg_post, edit_pg_post
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'delete_pg_post')).toBe(false);
  });

  test('user with admin role should have all admin permissions', async () => {
    await authzkit.assignRole(user, 'pg_admin');
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'delete_pg_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'view_pg_dashboard')).toBe(true);
  });

  test('user with no permissions/roles should not have any permissions', async () => {
    expect(await authzkit.hasPermission(user, 'create_pg_post')).toBe(false);
    expect(await authzkit.hasRole(user, 'pg_admin')).toBe(false);
  });

  test('roleHasPermission should work correctly', async () => {
    expect(await authzkit.roleHasPermission('pg_admin', 'create_pg_post')).toBe(true);
    expect(await authzkit.roleHasPermission('pg_editor', 'delete_pg_post')).toBe(false);
    expect(await authzkit.roleHasPermission('pg_viewer', 'view_pg_dashboard')).toBe(true);
    expect(await authzkit.roleHasPermission('non_existent_pg_role', 'some_permission')).toBe(false);
  });

  // --- Reset Tests ---
  test('reset should clear all permissions, roles, and assignments', async () => {
    await authzkit.definePermission('test_pg_perm');
    await authzkit.defineRole('test_pg_role', ['test_pg_perm']);
    await authzkit.assignRole(user, 'test_pg_role');
    await authzkit.assignPermission(user, 'test_pg_perm');

    await authzkit.reset();

    // After reset, defining again should not throw an error (as they were cleared)
    await expect(authzkit.definePermission('test_pg_perm')).resolves.not.toThrow();
    await expect(authzkit.defineRole('test_pg_role', ['test_pg_perm'])).resolves.not.toThrow();

    // User should no longer have the role/permission
    expect(await authzkit.hasRole(user, 'test_pg_role')).toBe(false);
    expect(await authzkit.hasPermission(user, 'test_pg_perm')).toBe(false);
  });
});
