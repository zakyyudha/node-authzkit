import { Authzkit } from '../src/classes/Authzkit';
import { Authorizable } from '../src/interfaces/Authorizable';
import { InMemoryAuthzkitStore } from '../src/stores/InMemoryAuthzkitStore';

describe('Authzkit', () => {
  let authzkit: Authzkit;
  let user: Authorizable;

  beforeEach(async () => {
    // Made beforeEach async
    // Each test gets a fresh Authzkit instance with a new InMemory store
    const inMemoryStore = new InMemoryAuthzkitStore();
    Authzkit.getInstance(inMemoryStore); // Initialize with new store
    authzkit = Authzkit.getInstance(); // Get the instance, ensure it's the one we just set
    await authzkit.reset(); // Ensure a clean state for each test

    // Define some permissions and roles
    await authzkit.definePermission('create_post');
    await authzkit.definePermission('edit_post');
    await authzkit.definePermission('delete_post');
    await authzkit.definePermission('view_dashboard');

    await authzkit.defineRole('admin', [
      'create_post',
      'edit_post',
      'delete_post',
      'view_dashboard',
    ]);
    await authzkit.defineRole('editor', ['create_post', 'edit_post']);
    await authzkit.defineRole('viewer', ['view_dashboard']);

    user = { id: 1, roles: [], permissions: [] };
  });

  // --- Permission Definition Tests ---
  test('should define a permission', async () => {
    const perm = await authzkit.definePermission('new_permission');
    expect(perm).toEqual({ name: 'new_permission', guard_name: undefined });
    await expect(authzkit.definePermission('new_permission')).rejects.toThrow(
      "Permission 'new_permission' already exists."
    );
  });

  // --- Role Definition Tests ---
  test('should define a role with permissions', async () => {
    // Made test async
    const role = await authzkit.defineRole('moderator', ['edit_post']);
    expect(role).toEqual({ name: 'moderator', permissions: ['edit_post'], guard_name: undefined });
    await expect(authzkit.defineRole('admin')).rejects.toThrow("Role 'admin' already exists.");
  });

  test('should throw error if role is defined with non-existent permission', async () => {
    await expect(authzkit.defineRole('bad_role', ['non_existent_permission'])).rejects.toThrow(
      "Permission 'non_existent_permission' not found when defining role 'bad_role'."
    );
  });

  // --- Assignment Tests ---
  test('should assign a role to a user', async () => {
    await authzkit.assignRole(user, 'editor');
    expect(await authzkit.hasRole(user, 'editor')).toBe(true);
    expect(await authzkit.hasRole(user, 'admin')).toBe(false);
  });

  test('should assign a direct permission to a user', async () => {
    await authzkit.assignPermission(user, 'create_post');
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_post')).toBe(false);
  });

  test('should throw error if assigning non-existent role', async () => {
    await expect(authzkit.assignRole(user, 'non_existent_role')).rejects.toThrow(
      "Role 'non_existent_role' not found."
    );
  });

  test('should throw error if assigning non-existent permission', async () => {
    await expect(authzkit.assignPermission(user, 'non_existent_permission')).rejects.toThrow(
      "Permission 'non_existent_permission' not found."
    );
  });

  // --- Revocation Tests ---
  test('should revoke a role from a user', async () => {
    await authzkit.assignRole(user, 'editor');
    expect(await authzkit.hasRole(user, 'editor')).toBe(true);
    await authzkit.revokeRole(user, 'editor');
    expect(await authzkit.hasRole(user, 'editor')).toBe(false);
  });

  test('should revoke a direct permission from a user', async () => {
    await authzkit.assignPermission(user, 'create_post');
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(true);
    await authzkit.revokePermission(user, 'create_post');
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(false);
  });

  // --- Has Role/Permission Tests ---
  test('user with role should have role', async () => {
    await authzkit.assignRole(user, 'admin');
    expect(await authzkit.hasRole(user, 'admin')).toBe(true);
  });

  test('user without role should not have role', async () => {
    expect(await authzkit.hasRole(user, 'admin')).toBe(false);
  });

  test('user with direct permission should have permission', async () => {
    await authzkit.assignPermission(user, 'edit_post');
    expect(await authzkit.hasPermission(user, 'edit_post')).toBe(true);
  });

  test('user with role having permission should have permission', async () => {
    await authzkit.assignRole(user, 'editor'); // editor has create_post, edit_post
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'delete_post')).toBe(false);
  });

  test('user with admin role should have all admin permissions', async () => {
    await authzkit.assignRole(user, 'admin');
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'edit_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'delete_post')).toBe(true);
    expect(await authzkit.hasPermission(user, 'view_dashboard')).toBe(true);
  });

  test('user with no permissions/roles should not have any permissions', async () => {
    expect(await authzkit.hasPermission(user, 'create_post')).toBe(false);
    expect(await authzkit.hasRole(user, 'admin')).toBe(false);
  });

  test('roleHasPermission should work correctly', async () => {
    expect(await authzkit.roleHasPermission('admin', 'create_post')).toBe(true);
    expect(await authzkit.roleHasPermission('editor', 'delete_post')).toBe(false);
    expect(await authzkit.roleHasPermission('viewer', 'view_dashboard')).toBe(true);
    expect(await authzkit.roleHasPermission('non_existent_role', 'some_permission')).toBe(false);
  });

  // --- Reset Tests ---
  test('reset should clear all permissions, roles, and assignments', async () => {
    await authzkit.definePermission('test_perm');
    await authzkit.defineRole('test_role', ['test_perm']);
    await authzkit.assignRole(user, 'test_role');
    await authzkit.assignPermission(user, 'test_perm');

    await authzkit.reset();

    // After reset, defining again should not throw an error (as they were cleared)
    await expect(authzkit.definePermission('test_perm')).resolves.not.toThrow();
    await expect(authzkit.defineRole('test_role', ['test_perm'])).resolves.not.toThrow();

    // User should no longer have the role/permission
    expect(await authzkit.hasRole(user, 'test_role')).toBe(false);
    expect(await authzkit.hasPermission(user, 'test_perm')).toBe(false);
  });
});
