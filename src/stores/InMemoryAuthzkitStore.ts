import { IAuthzkitStore } from './IAuthzkitStore';
import { Permission } from '../interfaces/Permission';
import { Role } from '../interfaces/Role';

export class InMemoryAuthzkitStore implements IAuthzkitStore {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string | number, Set<string>> = new Map();
  private userPermissions: Map<string | number, Set<string>> = new Map();

  async getPermission(name: string): Promise<Permission | undefined> {
    return this.permissions.get(name);
  }

  async getPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async setPermission(permission: Permission): Promise<void> {
    this.permissions.set(permission.name, permission);
  }

  async hasPermission(name: string): Promise<boolean> {
    return this.permissions.has(name);
  }

  async deletePermission(name: string): Promise<void> {
    this.permissions.delete(name);
  }

  async getRole(name: string): Promise<Role | undefined> {
    return this.roles.get(name);
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async setRole(role: Role): Promise<void> {
    this.roles.set(role.name, role);
  }

  async hasRole(name: string): Promise<boolean> {
    return this.roles.has(name);
  }

  async deleteRole(name: string): Promise<void> {
    this.roles.delete(name);
  }

  async getUserRoles(userId: string | number): Promise<Set<string>> {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    return this.userRoles.get(userId)!;
  }

  async addUserRole(userId: string | number, roleName: string): Promise<void> {
    (await this.getUserRoles(userId)).add(roleName);
  }

  async removeUserRole(userId: string | number, roleName: string): Promise<void> {
    (await this.getUserRoles(userId)).delete(roleName);
    if ((await this.getUserRoles(userId)).size === 0) {
      this.userRoles.delete(userId);
    }
  }

  async hasUserRole(userId: string | number, roleName: string): Promise<boolean> {
    return (await this.getUserRoles(userId)).has(roleName);
  }

  async getUserPermissions(userId: string | number): Promise<Set<string>> {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set());
    }
    return this.userPermissions.get(userId)!;
  }

  async addUserPermission(userId: string | number, permissionName: string): Promise<void> {
    (await this.getUserPermissions(userId)).add(permissionName);
  }

  async removeUserPermission(userId: string | number, permissionName: string): Promise<void> {
    (await this.getUserPermissions(userId)).delete(permissionName);
    if ((await this.getUserPermissions(userId)).size === 0) {
      this.userPermissions.delete(userId);
    }
  }

  async hasUserPermission(userId: string | number, permissionName: string): Promise<boolean> {
    return (await this.getUserPermissions(userId)).has(permissionName);
  }

  async reset(): Promise<void> {
    this.permissions.clear();
    this.roles.clear();
    this.userRoles.clear();
    this.userPermissions.clear();
  }
}
