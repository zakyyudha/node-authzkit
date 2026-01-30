import { Authzkit } from '../src/classes/Authzkit';
import { MongoConnection } from '../src/drivers/mongodb/mongo-connection';
import { MongoAuthzkitStore } from '../src/stores/MongoAuthzkitStore';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { IAuthzkitConfig } from '../src/interfaces/IAuthzkitConfig';

// Increase Jest timeout for MongoDB operations
jest.setTimeout(30000); // 30 seconds

describe('MongoAuthzkitStore (Custom Collections)', () => {
  let mongod: MongoMemoryServer;
  let mongoClient: MongoClient;
  let mongoConnection: MongoConnection;
  let mongoAuthzkitStore: MongoAuthzkitStore;
  let authzkit: Authzkit;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const dbName = 'authzkit_test_custom_db';

    // Connect MongoClient and pass it to MongoConnection
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();

    const config: IAuthzkitConfig = {
      connection: {
        type: 'mongodb',
        uri: uri,
        database: dbName,
      },
      models: {
        users: 'custom_users',
        roles: 'custom_roles',
        permissions: 'custom_permissions',
        user_roles: 'custom_user_roles',
        user_permissions: 'custom_user_permissions',
      },
    };

    mongoConnection = MongoConnection.getInstance(config, mongoClient);
    await mongoConnection.connect(); // This should now just set the db instance

    // Ensure the database is clean before running tests
    await mongoConnection.getDb().dropDatabase();
  });

  beforeEach(async () => {
    // Re-initialize store and authzkit for each test to ensure isolation
    mongoAuthzkitStore = new MongoAuthzkitStore(mongoConnection);
    Authzkit.getInstance(mongoAuthzkitStore);
    authzkit = Authzkit.getInstance();
    await authzkit.reset(); // Clear all data for current test

    await authzkit.definePermission('custom_perm');
  });

  afterAll(async () => {
    await mongoConnection.getDb().dropDatabase(); // Clean up database after all tests
    await mongoClient.close(); // Close the MongoClient connection
    await mongod.stop(); // Stop the in-memory MongoDB server
  });

  test('should store data in custom collections', async () => {
    const db = mongoConnection.getDb();
    // Verify data is in 'custom_permissions' collection
    const count = await db.collection('custom_permissions').countDocuments({ name: 'custom_perm' });
    expect(count).toBe(1);

    // Verify default collection is empty
    const defaultCount = await db.collection('permissions').countDocuments({ name: 'custom_perm' });
    expect(defaultCount).toBe(0);
  });
});
