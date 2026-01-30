import { Db, Collection } from 'mongodb';
import { IAuthzkitStore } from './IAuthzkitStore';
import { Permission } from '../interfaces/Permission';
import { Role } from '../interfaces/Role';
import { MongoConnection } from '../drivers/mongodb/mongo-connection';

interface MongoPermission extends Permission {}

interface MongoRole extends Role {}

interface MongoUserRole {
  userId: string | number;
  roleName: string;
}

interface MongoUserPermission {
  userId: string | number;
  permissionName: string;
}

export class MongoAuthzkitStore implements IAuthzkitStore {
  private db: Db;
  private permissionsCollection: Collection<MongoPermission>;
  private rolesCollection: Collection<MongoRole>;
  private userRolesCollection: Collection<MongoUserRole>;
  private userPermissionsCollection: Collection<MongoUserPermission>;

  constructor(mongoConnection: MongoConnection) {
    this.db = mongoConnection.getDb();
    this.permissionsCollection = this.db.collection(
      mongoConnection.getCollectionName('permissions')
    );
    this.rolesCollection = this.db.collection(mongoConnection.getCollectionName('roles'));
    this.userRolesCollection = this.db.collection(mongoConnection.getCollectionName('user_roles'));
    this.userPermissionsCollection = this.db.collection(
      mongoConnection.getCollectionName('user_permissions')
    );

    // Ensure unique indexes
    void this.permissionsCollection.createIndex({ name: 1 }, { unique: true }).catch(console.error);
    void this.rolesCollection.createIndex({ name: 1 }, { unique: true }).catch(console.error);
    void this.userRolesCollection
      .createIndex({ userId: 1, roleName: 1 }, { unique: true })
      .catch(console.error);
    void this.userPermissionsCollection
      .createIndex({ userId: 1, permissionName: 1 }, { unique: true })
      .catch(console.error);
  }

  async getPermission(name: string): Promise<Permission | undefined> {
    const perm = await this.permissionsCollection.findOne({ name });
    return perm ? { name: perm.name, guard_name: perm.guard_name } : undefined;
  }

  async getPermissions(): Promise<Permission[]> {
    const perms = await this.permissionsCollection.find({}).toArray();
    return perms.map((perm) => ({ name: perm.name, guard_name: perm.guard_name }));
  }

  async setPermission(permission: Permission): Promise<void> {
    await this.permissionsCollection.updateOne(
      { name: permission.name },
      { $set: permission },
      { upsert: true }
    );
  }

  async hasPermission(name: string): Promise<boolean> {
    const count = await this.permissionsCollection.countDocuments({ name });
    return count > 0;
  }

  async deletePermission(name: string): Promise<void> {
    await this.permissionsCollection.deleteOne({ name });
  }

  async getRole(name: string): Promise<Role | undefined> {
    const role = await this.rolesCollection.findOne({ name });
    return role
      ? { name: role.name, guard_name: role.guard_name, permissions: role.permissions }
      : undefined;
  }

  async getRoles(): Promise<Role[]> {
    const roles = await this.rolesCollection.find({}).toArray();
    return roles.map((role) => ({
      name: role.name,
      guard_name: role.guard_name,
      permissions: role.permissions,
    }));
  }

  async setRole(role: Role): Promise<void> {
    await this.rolesCollection.updateOne(
      { name: role.name },
      { $set: { name: role.name, guard_name: role.guard_name, permissions: role.permissions } },
      { upsert: true }
    );
  }

  async hasRole(name: string): Promise<boolean> {
    const count = await this.rolesCollection.countDocuments({ name });
    return count > 0;
  }

  async deleteRole(name: string): Promise<void> {
    await this.rolesCollection.deleteOne({ name });
    await this.userRolesCollection.deleteMany({ roleName: name }); // Remove all assignments for this role
  }

  async getUserRoles(userId: string | number): Promise<Set<string>> {
    const userRoles = await this.userRolesCollection.find({ userId }).toArray();
    return new Set(userRoles.map((ur) => ur.roleName));
  }

  async addUserRole(userId: string | number, roleName: string): Promise<void> {
    try {
      await this.userRolesCollection.insertOne({ userId, roleName });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        // Role already assigned, ignore
      } else {
        throw error;
      }
    }
  }

  async removeUserRole(userId: string | number, roleName: string): Promise<void> {
    await this.userRolesCollection.deleteOne({ userId, roleName });
  }

  async hasUserRole(userId: string | number, roleName: string): Promise<boolean> {
    const count = await this.userRolesCollection.countDocuments({ userId, roleName });
    return count > 0;
  }

  async getUserPermissions(userId: string | number): Promise<Set<string>> {
    const userPermissions = await this.userPermissionsCollection.find({ userId }).toArray();
    return new Set(userPermissions.map((up) => up.permissionName));
  }

  async addUserPermission(userId: string | number, permissionName: string): Promise<void> {
    try {
      await this.userPermissionsCollection.insertOne({ userId, permissionName });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        // Permission already assigned, ignore
      } else {
        throw error;
      }
    }
  }

  async removeUserPermission(userId: string | number, permissionName: string): Promise<void> {
    await this.userPermissionsCollection.deleteOne({ userId, permissionName });
  }

  async hasUserPermission(userId: string | number, permissionName: string): Promise<boolean> {
    const count = await this.userPermissionsCollection.countDocuments({ userId, permissionName });
    return count > 0;
  }

  async reset(): Promise<void> {
    await this.permissionsCollection.deleteMany({});
    await this.rolesCollection.deleteMany({});
    await this.userRolesCollection.deleteMany({});
    await this.userPermissionsCollection.deleteMany({});
  }
}
