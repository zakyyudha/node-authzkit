import { Permission } from '../interfaces/Permission';
import { Role } from '../interfaces/Role';

export interface IAuthzkitStore {
  // Permissions
  getPermission(name: string): Promise<Permission | undefined>;
  getPermissions(): Promise<Permission[]>; // Added for dashboard
  setPermission(permission: Permission): Promise<void>;
  hasPermission(name: string): Promise<boolean>;
  deletePermission(name: string): Promise<void>;

  // Roles
  getRole(name: string): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>; // Added for dashboard
  setRole(role: Role): Promise<void>;
  hasRole(name: string): Promise<boolean>;
  deleteRole(name: string): Promise<void>;

  // User Roles
  getUserRoles(userId: string | number): Promise<Set<string>>;
  addUserRole(userId: string | number, roleName: string): Promise<void>;
  removeUserRole(userId: string | number, roleName: string): Promise<void>;
  hasUserRole(userId: string | number, roleName: string): Promise<boolean>;

  // User Permissions
  getUserPermissions(userId: string | number): Promise<Set<string>>;
  addUserPermission(userId: string | number, permissionName: string): Promise<void>;
  removeUserPermission(userId: string | number, permissionName: string): Promise<void>;
  hasUserPermission(userId: string | number, permissionName: string): Promise<boolean>;

  // Reset
  reset(): Promise<void>;
}
