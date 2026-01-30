import express from 'express';
import {
  Authzkit,
  InMemoryAuthzkitStore,
  createDashboardRouter,
  loadConfigFromEnv,
} from '@zakyyudha/node-authzkit';

let authzkit;

const app = express();
const port = 3000;

try {
  // Initialize Authzkit
  // Example: Load from env or default to InMemory
  const config = loadConfigFromEnv();
  if (config) {
    console.log('Using configured store from environment');
    // Here you would initialize Mongo/Pg connection based on config
    // For this example we default to InMemory to keep it runnable without DB
  } else {
    console.log('Using In-Memory Store');
  }

  authzkit = Authzkit.getInstance(new InMemoryAuthzkitStore());

  // Setup Dashboard
  // Mount at /authzkit
  // Basic Auth: admin / mysecret
  app.use(
    '/authzkit',
    createDashboardRouter({
      authzkit,
      secret: 'mysecret',
      username: 'admin',
    })
  );
} catch (error) {
  console.error('Failed to initialize Authzkit or Dashboard:', error);
  process.exit(1); // Exit the process if initialization fails
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.get('/', (req, res) => {
  res.send(
    'Go to <a href="/authzkit/">/authzkit/</a> to manage permissions. (User: admin, Pass: mysecret)'
  );
});

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  console.log(`Dashboard available at http://localhost:${port}/authzkit/`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
