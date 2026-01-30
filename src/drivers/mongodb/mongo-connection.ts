import { MongoClient, Db } from 'mongodb';
import { IAuthzkitConfig } from '../../interfaces/IAuthzkitConfig';

export class MongoConnection {
  private static instance: MongoConnection | null = null;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: IAuthzkitConfig;

  private constructor(config: IAuthzkitConfig) {
    this.config = config;
  }

  public static getInstance(config: IAuthzkitConfig, client?: MongoClient): MongoConnection {
    // If an existing instance exists and same URI/DB, return it.
    if (
      MongoConnection.instance &&
      MongoConnection.instance.config.connection.uri === config.connection.uri &&
      MongoConnection.instance.config.connection.database === config.connection.database &&
      !client
    ) {
      return MongoConnection.instance;
    }

    // Create a new instance
    MongoConnection.instance = new MongoConnection(config);
    if (client) {
      MongoConnection.instance.client = client;
      if (config.connection.database) {
        MongoConnection.instance.db = client.db(config.connection.database);
      }
    }
    return MongoConnection.instance;
  }

  public async connect(): Promise<void> {
    const dbName = this.config.connection.database;
    if (!dbName) {
      throw new Error('Database name not provided in configuration.');
    }

    // If client is already set (e.g., from mongodb-memory-server), just ensure db is set
    if (this.client) {
      // Assuming client options might not directly expose dbName in a standard way across versions,
      // relying on the configured dbName.
      if (!this.db) {
        this.db = this.client.db(dbName);
      }
      console.log('MongoDB client already provided/connected.');
      return;
    }

    if (!this.config.connection.uri) {
      throw new Error('MongoDB URI not provided in configuration.');
    }

    try {
      this.client = await MongoClient.connect(this.config.connection.uri);
      this.db = this.client.db(dbName);
      console.log('Connected to MongoDB successfully.');
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB.');
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public getConfig(): IAuthzkitConfig {
    return this.config;
  }

  public getCollectionName(name: keyof NonNullable<IAuthzkitConfig['models']>): string {
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
}
