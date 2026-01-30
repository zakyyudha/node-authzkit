import { Pool, QueryResult, Client as PgClient } from 'pg';
import { IMemoryDb } from 'pg-mem';
import { IAuthzkitConfig } from '../../interfaces/IAuthzkitConfig';

export class PgConnection {
  private static instance: PgConnection | null = null;
  private poolOrClient: Pool | PgClient | null = null;
  private config: IAuthzkitConfig;

  private constructor(config: IAuthzkitConfig) {
    this.config = config;
  }

  public static getInstance(config: IAuthzkitConfig, inMemoryDb?: IMemoryDb): PgConnection {
    // Check if instance exists and config matches (simplified)
    if (
      PgConnection.instance &&
      PgConnection.instance.config.connection.uri === config.connection.uri &&
      !inMemoryDb
    ) {
      return PgConnection.instance;
    }

    const instance = new PgConnection(config);
    if (inMemoryDb) {
      // Use pg-mem's adapter
      instance.poolOrClient = new (inMemoryDb.adapters.createPg().Client)() as PgClient;
    }
    PgConnection.instance = instance;
    return PgConnection.instance;
  }

  public async connect(): Promise<void> {
    if (
      this.poolOrClient &&
      (this.poolOrClient instanceof Pool || this.poolOrClient instanceof PgClient)
    ) {
      console.log('Already connected to PostgreSQL.');
      return;
    }
    if (this.poolOrClient) {
      console.log('In-memory PostgreSQL client already provided.');
      return;
    }

    try {
      // Create pool using config
      const poolConfig: any = {};
      if (this.config.connection.uri) {
        poolConfig.connectionString = this.config.connection.uri;
      } else {
        poolConfig.host = this.config.connection.host;
        poolConfig.port = this.config.connection.port;
        poolConfig.user = this.config.connection.user;
        poolConfig.password = this.config.connection.password;
        poolConfig.database = this.config.connection.database;
      }

      this.poolOrClient = new Pool(poolConfig);
      await (this.poolOrClient as Pool).query('SELECT 1');
      console.log('Connected to PostgreSQL successfully.');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.poolOrClient && this.poolOrClient instanceof Pool) {
      await this.poolOrClient.end();
      this.poolOrClient = null;
      console.log('Disconnected from PostgreSQL.');
    } else if (this.poolOrClient) {
      console.log('In-memory PostgreSQL instance, no explicit disconnect needed for pool.');
      this.poolOrClient = null;
    }
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    if (!this.poolOrClient) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return (this.poolOrClient as Pool | PgClient).query(text, params);
  }

  public getTableName(name: keyof NonNullable<IAuthzkitConfig['models']>): string {
    const models = this.config.models || {};
    const defaults: Record<string, string> = {
      users: 'users',
      roles: 'roles',
      permissions: 'permissions',
      user_roles: 'user_roles',
      user_permissions: 'user_permissions',
    };
    return models[name] || defaults[name] || name;
  }

  public async initSchema(): Promise<void> {
    const permissionsTable = this.getTableName('permissions');
    const rolesTable = this.getTableName('roles');
    const userRolesTable = this.getTableName('user_roles');
    const userPermissionsTable = this.getTableName('user_permissions');

    await this.query(`
      CREATE TABLE IF NOT EXISTS ${permissionsTable} (
        name VARCHAR(255) PRIMARY KEY,
        guard_name VARCHAR(255)
      );
    `);
    await this.query(`
      CREATE TABLE IF NOT EXISTS ${rolesTable} (
        name VARCHAR(255) PRIMARY KEY,
        guard_name VARCHAR(255),
        permissions TEXT[] DEFAULT '{}'
      );
    `);
    await this.query(`
      CREATE TABLE IF NOT EXISTS ${userRolesTable} (
        user_id VARCHAR(255) NOT NULL,
        role_name VARCHAR(255) REFERENCES ${rolesTable}(name) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_name)
      );
    `);
    await this.query(`
      CREATE TABLE IF NOT EXISTS ${userPermissionsTable} (
        user_id VARCHAR(255) NOT NULL,
        permission_name VARCHAR(255) REFERENCES ${permissionsTable}(name) ON DELETE CASCADE,
        PRIMARY KEY (user_id, permission_name)
      );
    `);
    console.log('PostgreSQL schema initialized.');
  }

  public async truncateTables(): Promise<void> {
    const permissionsTable = this.getTableName('permissions');
    const rolesTable = this.getTableName('roles');
    const userRolesTable = this.getTableName('user_roles');
    const userPermissionsTable = this.getTableName('user_permissions');

    await this.query(`TRUNCATE TABLE ${userPermissionsTable} CASCADE;`);
    await this.query(`TRUNCATE TABLE ${userRolesTable} CASCADE;`);
    await this.query(`TRUNCATE TABLE ${rolesTable} CASCADE;`);
    await this.query(`TRUNCATE TABLE ${permissionsTable} CASCADE;`);
    console.log('PostgreSQL tables truncated.');
  }

  public async dropSchema(): Promise<void> {
    const permissionsTable = this.getTableName('permissions');
    const rolesTable = this.getTableName('roles');
    const userRolesTable = this.getTableName('user_roles');
    const userPermissionsTable = this.getTableName('user_permissions');

    await this.query(`DROP TABLE IF EXISTS ${userPermissionsTable} CASCADE;`);
    await this.query(`DROP TABLE IF EXISTS ${userRolesTable} CASCADE;`);
    await this.query(`DROP TABLE IF EXISTS ${rolesTable} CASCADE;`);
    await this.query(`DROP TABLE IF EXISTS ${permissionsTable} CASCADE;`);
    console.log('PostgreSQL schema dropped.');
  }
}
