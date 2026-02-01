import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import {
  Authzkit,
  MongoAuthzkitStore,
  MongoConnection,
  authorize,
  createDashboardRouter,
  IAuthzkitConfig,
} from '@zakyyudha/node-authzkit';
import { Authorizable } from '../src';

async function bootstrap() {
  // 1) Start an in-memory MongoDB server
  const mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'authzkit_demo' },
  });

  // 2) Build Authzkit config
  const uri = mongoServer.getUri();
  const config: IAuthzkitConfig = {
    connection: {
      type: 'mongodb',
      uri,
      database: 'authzkit_demo',
    },
  };

  // 3) Connect Mongo client and initialize Authzkit store
  const client = new MongoClient(uri);
  await client.connect();

  const mongoConnection = MongoConnection.getInstance(config, client);
  await mongoConnection.connect();

  const store = new MongoAuthzkitStore(mongoConnection);
  const authzkit = Authzkit.getInstance(store);

  // 4) Define permissions/roles
  await authzkit.definePermission('edit_posts');
  await authzkit.defineRole('editor', ['edit_posts']);

  const user = { id: 'user_1' } as Authorizable;
  await authzkit.assignRole(user, 'editor');

  // 5) Express app with authorization middleware
  const app = express();

  // Dashboard (Basic Auth + JWT for API)
  app.use(
    '/authzkit',
    createDashboardRouter({
      authzkit,
      secret: 'mysecret',
      username: 'admin',
      jwtSecret: 'myjwtsecret',
      jwtExpiresIn: '1h',
    })
  );

  app.get('/posts', (req, res) => {
    res.send('Public posts');
  });

  app.post('/posts', authorize('edit_posts'), (req, res) => {
    res.send('Post created');
  });

  const server = app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });

  // 6) Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoConnection.disconnect();
    await client.close();
    await mongoServer.stop();
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
