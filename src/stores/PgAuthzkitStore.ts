import { IAuthzkitStore } from './IAuthzkitStore';
import { Permission } from '../interfaces/Permission';
import { Role } from '../interfaces/Role';
import { PgConnection } from '../drivers/postgres/pg-connection';

export class PgAuthzkitStore implements IAuthzkitStore {
  private pgConnection: PgConnection;
  private permissionsTable: string;
  private rolesTable: string;
  private userRolesTable: string;
  private userPermissionsTable: string;

  constructor(pgConnection: PgConnection) {
    this.pgConnection = pgConnection;
    this.permissionsTable = this.pgConnection.getTableName('permissions');
    this.rolesTable = this.pgConnection.getTableName('roles');
    this.userRolesTable = this.pgConnection.getTableName('user_roles');
    this.userPermissionsTable = this.pgConnection.getTableName('user_permissions');
  }

  async getPermission(name: string): Promise<Permission | undefined> {
    const res = await this.pgConnection.query(
      `SELECT name, guard_name FROM ${this.permissionsTable} WHERE name = $1`,
      [name]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return undefined;
  }

  async getPermissions(): Promise<Permission[]> {
    const res = await this.pgConnection.query(
      `SELECT name, guard_name FROM ${this.permissionsTable}`
    );
    return res.rows.map((row) => ({ name: row.name, guard_name: row.guard_name }));
  }

  async setPermission(permission: Permission): Promise<void> {
    await this.pgConnection.query(
      `INSERT INTO ${this.permissionsTable} (name, guard_name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET guard_name = $2`,
      [permission.name, permission.guard_name]
    );
  }

  async hasPermission(name: string): Promise<boolean> {
    const res = await this.pgConnection.query(
      `SELECT 1 FROM ${this.permissionsTable} WHERE name = $1`,
      [name]
    );
    return res.rows.length > 0;
  }

  async deletePermission(name: string): Promise<void> {
    await this.pgConnection.query(`DELETE FROM ${this.permissionsTable} WHERE name = $1`, [name]);
  }

  async getRole(name: string): Promise<Role | undefined> {
    const res = await this.pgConnection.query(
      `SELECT name, guard_name, permissions FROM ${this.rolesTable} WHERE name = $1`,
      [name]
    );
    if (res.rows.length > 0) {
      // Ensure permissions are correctly deserialized if stored as string array
      const roleData = res.rows[0];
      return {
        name: roleData.name,
        guard_name: roleData.guard_name,
        permissions: Array.isArray(roleData.permissions) ? roleData.permissions : [],
      };
    }
    return undefined;
  }

  async getRoles(): Promise<Role[]> {
    const res = await this.pgConnection.query(
      `SELECT name, guard_name, permissions FROM ${this.rolesTable}`
    );
    return res.rows.map((roleData) => ({
      name: roleData.name,
      guard_name: roleData.guard_name,
      permissions: Array.isArray(roleData.permissions) ? roleData.permissions : [],
    }));
  }

  async setRole(role: Role): Promise<void> {
    await this.pgConnection.query(
      `INSERT INTO ${this.rolesTable} (name, guard_name, permissions) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET guard_name = $2, permissions = $3`,
      [role.name, role.guard_name, role.permissions]
    );
  }

  async hasRole(name: string): Promise<boolean> {
    const res = await this.pgConnection.query(`SELECT 1 FROM ${this.rolesTable} WHERE name = $1`, [
      name,
    ]);
    return res.rows.length > 0;
  }

  async deleteRole(name: string): Promise<void> {
    await this.pgConnection.query(`DELETE FROM ${this.rolesTable} WHERE name = $1`, [name]);
    // CASCADE DELETE should handle user_roles table if set up correctly via foreign keys
  }

  async getUserRoles(userId: string | number): Promise<Set<string>> {
    const res = await this.pgConnection.query(
      `SELECT role_name FROM ${this.userRolesTable} WHERE user_id = $1`,
      [userId.toString()]
    );
    return new Set(res.rows.map((row) => row.role_name));
  }

  async addUserRole(userId: string | number, roleName: string): Promise<void> {
    try {
      await this.pgConnection.query(
        `INSERT INTO ${this.userRolesTable} (user_id, role_name) VALUES ($1, $2)`,
        [userId.toString(), roleName]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation error
        // Role already assigned, ignore
      } else {
        throw error;
      }
    }
  }

  async removeUserRole(userId: string | number, roleName: string): Promise<void> {
    await this.pgConnection.query(
      `DELETE FROM ${this.userRolesTable} WHERE user_id = $1 AND role_name = $2`,
      [userId.toString(), roleName]
    );
  }

  async hasUserRole(userId: string | number, roleName: string): Promise<boolean> {
    const res = await this.pgConnection.query(
      `SELECT 1 FROM ${this.userRolesTable} WHERE user_id = $1 AND role_name = $2`,
      [userId.toString(), roleName]
    );
    return res.rows.length > 0;
  }

  async getUserPermissions(userId: string | number): Promise<Set<string>> {
    const res = await this.pgConnection.query(
      `SELECT permission_name FROM ${this.userPermissionsTable} WHERE user_id = $1`,
      [userId.toString()]
    );
    return new Set(res.rows.map((row) => row.permission_name));
  }

  async addUserPermission(userId: string | number, permissionName: string): Promise<void> {
    try {
      await this.pgConnection.query(
        `INSERT INTO ${this.userPermissionsTable} (user_id, permission_name) VALUES ($1, $2)`,
        [userId.toString(), permissionName]
      );
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation error
        // Permission already assigned, ignore
      } else {
        throw error;
      }
    }
  }

  async removeUserPermission(userId: string | number, permissionName: string): Promise<void> {
    await this.pgConnection.query(
      `DELETE FROM ${this.userPermissionsTable} WHERE user_id = $1 AND permission_name = $2`,
      [userId.toString(), permissionName]
    );
  }

  async hasUserPermission(userId: string | number, permissionName: string): Promise<boolean> {
    const count = await this.pgConnection.query(
      `SELECT 1 FROM ${this.userPermissionsTable} WHERE user_id = $1 AND permission_name = $2`,
      [userId.toString(), permissionName]
    );
    return count.rows.length > 0;
  }

  async reset(): Promise<void> {
    try {
      await this.pgConnection.truncateTables();
    } catch (error) {
      // If truncation fails (e.g., tables don't exist), try initializing the schema
      await this.pgConnection.initSchema();
    }
  }
}
