import { Authorizable } from '../interfaces/Authorizable';
import { Permission } from '../interfaces/Permission';
import { Role } from '../interfaces/Role';
import { IAuthzkitStore } from '../stores/IAuthzkitStore';
import { InMemoryAuthzkitStore } from '../stores/InMemoryAuthzkitStore';

export class Authzkit {
  private static instance: Authzkit;
  private store: IAuthzkitStore;

  private constructor(store?: IAuthzkitStore) {
    this.store = store || new InMemoryAuthzkitStore();
  }

  /**
   * Returns the singleton instance of Authzkit.
   * Optionally accepts a store implementation to use. If no store is provided,
   * an `InMemoryAuthzkitStore` will be used by default.
   */
  public static getInstance(store?: IAuthzkitStore): Authzkit {
    if (!Authzkit.instance) {
      Authzkit.instance = new Authzkit(store);
    }
    return Authzkit.instance;
  }

  /**
   * Defines a new permission.
   * @param name The name of the permission.
   * @param guard_name Optional guard name.
   */
  public async definePermission(name: string, guard_name?: string): Promise<Permission> {
    if (await this.store.hasPermission(name)) {
      throw new Error(`Permission '${name}' already exists.`);
    }
    const permission: Permission = { name, guard_name };
    await this.store.setPermission(permission);
    return permission;
  }

  /**
   * Retrieves all defined permissions.
   * @returns An array of Permission objects.
   */
  public async getPermissions(): Promise<Permission[]> {
    return await this.store.getPermissions();
  }

  /**
   * Retrieves all defined roles.
   * @returns An array of Role objects.
   */
  public async getRoles(): Promise<Role[]> {
    return await this.store.getRoles();
  }

  /**
   * Defines a new role with associated permissions.
   * @param name The name of the role.
   * @param permissions An array of permission names.
   * @param guard_name Optional guard name.
   */
  public async defineRole(
    name: string,
    permissions: string[] = [],
    guard_name?: string
  ): Promise<Role> {
    if (await this.store.hasRole(name)) {
      throw new Error(`Role '${name}' already exists.`);
    }
    // Ensure all provided permissions exist
    for (const pName of permissions) {
      if (!(await this.store.hasPermission(pName))) {
        throw new Error(`Permission '${pName}' not found when defining role '${name}'.`);
      }
    }

    const role: Role = { name, permissions, guard_name }; // Store permission names
    await this.store.setRole(role);
    return role;
  }

  /**
   * Deletes a permission.
   * @param name The name of the permission to delete.
   */
  public async deletePermission(name: string): Promise<void> {
    await this.store.deletePermission(name);
  }

  /**
   * Deletes a role.
   * @param name The name of the role to delete.
   */
  public async deleteRole(name: string): Promise<void> {
    await this.store.deleteRole(name);
  }

  /**
   * Retrieves roles assigned to a user.
   * @param authorizable The user for whom to retrieve roles.
   * @returns A Promise resolving to a Set of role names.
   */
  public async getUserRoles(authorizable: Authorizable): Promise<Set<string>> {
    return await this.store.getUserRoles(authorizable.id);
  }

  /**
   * Retrieves permissions assigned directly to a user.
   * @param authorizable The user for whom to retrieve permissions.
   * @returns A Promise resolving to a Set of permission names.
   */
  public async getUserPermissions(authorizable: Authorizable): Promise<Set<string>> {
    return await this.store.getUserPermissions(authorizable.id);
  }

  /**
   * Assigns a role to an authorizable entity.
   * @param authorizable The entity to assign the role to.
   * @param roleName The name of the role to assign.
   */
  public async assignRole(authorizable: Authorizable, roleName: string): Promise<void> {
    if (!(await this.store.hasRole(roleName))) {
      throw new Error(`Role '${roleName}' not found.`);
    }
    await this.store.addUserRole(authorizable.id, roleName);
  }

  /**
   * Assigns a direct permission to an authorizable entity.
   * @param authorizable The entity to assign the permission to.
   * @param permissionName The name of the permission to assign.
   */
  public async assignPermission(authorizable: Authorizable, permissionName: string): Promise<void> {
    if (!(await this.store.hasPermission(permissionName))) {
      throw new Error(`Permission '${permissionName}' not found.`);
    }
    await this.store.addUserPermission(authorizable.id, permissionName);
  }

  /**
   * Revokes a role from an authorizable entity.
   * @param authorizable The entity to revoke the role from.
   * @param roleName The name of the role to revoke.
   */
  public async revokeRole(authorizable: Authorizable, roleName: string): Promise<void> {
    await this.store.removeUserRole(authorizable.id, roleName);
  }

  /**
   * Revokes a direct permission from an authorizable entity.
   * @param authorizable The entity to revoke the permission from.
   * @param permissionName The name of the permission to revoke.
   */
  public async revokePermission(authorizable: Authorizable, permissionName: string): Promise<void> {
    await this.store.removeUserPermission(authorizable.id, permissionName);
  }

  /**
   * Checks if an authorizable entity has a given role.
   * @param authorizable The entity to check.
   * @param roleName The name of the role to check for.
   * @returns True if the entity has the role, false otherwise.
   */
  public async hasRole(authorizable: Authorizable, roleName: string): Promise<boolean> {
    return await this.store.hasUserRole(authorizable.id, roleName);
  }

  /**
   * Checks if an authorizable entity has a given permission, either directly or through a role.
   * @param authorizable The entity to check.
   * @param permissionName The name of the permission to check for.
   * @returns True if the entity has the permission, false otherwise.
   */
  public async hasPermission(authorizable: Authorizable, permissionName: string): Promise<boolean> {
    // Check direct permissions from store
    if (await this.store.hasUserPermission(authorizable.id, permissionName)) {
      return true;
    }

    // Check permissions via roles
    const roles = await this.store.getUserRoles(authorizable.id);
    if (roles) {
      for (const roleName of roles) {
        const role = await this.store.getRole(roleName);
        // Check if the role has the permission
        if (role && role.permissions.includes(permissionName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if a role has a specific permission.
   * @param roleName The name of the role.
   * @param permissionName The name of the permission.
   * @returns True if the role has the permission, false otherwise.
   */
  public async roleHasPermission(roleName: string, permissionName: string): Promise<boolean> {
    const role = await this.store.getRole(roleName);
    return role ? role.permissions.includes(permissionName) : false;
  }

  /**
   * Resets all defined permissions, roles, and assigned user roles/permissions.
   * Useful for testing.
   */
  public async reset(): Promise<void> {
    await this.store.reset();
  }
}
