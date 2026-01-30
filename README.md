
# node-authzkit

`node-authzkit` is a TypeScript library for Node.js that provides role and permission management. It allows you to define roles and permissions, assign them to "authorizable" entities (like users), and easily check for access rights.

## Features

-   **Role and Permission Definition:** Programmatically define permissions and roles with associated permissions.
-   **Assignment:** Assign roles and direct permissions to any entity that implements the `Authorizable` interface.
-   **Revocation:** Revoke roles and direct permissions.
-   **Access Checks:** Convenient methods to check if an entity has a specific role or permission (either directly or via an assigned role).
-   **Multiple Backends:** Supports In-Memory, MongoDB, and PostgreSQL storages out of the box.
-   **Dynamic Configuration:** Customize database connection details and collection/table names via configuration.
-   **Express.js Middleware:** Includes an Express.js middleware for easy route protection based on roles and permissions.
-   **Dashboard:** Comes with a built-in dashboard for managing roles and permissions (source code included).

## Installation

```bash
pnpm install node-authzkit
# or npm install node-authzkit
# or yarn add node-authzkit
```

## Quick Start

### 1. Initialize Authzkit

First, initialize the `Authzkit` singleton. You can provide a custom store, or it will default to `InMemoryAuthzkitStore`.

```typescript
// src/main.ts
import { Authzkit, InMemoryAuthzkitStore } from 'node-authzkit';

const authzkit = Authzkit.getInstance(new InMemoryAuthzkitStore());

// Or, if you don't provide a store, it defaults to InMemoryAuthzkitStore
// const authzkit = Authzkit.getInstance();

export default authzkit;
```

### 2. persistence with MongoDB or PostgreSQL

You use `IAuthzkitConfig` to configure connection details and custom table/collection names.

**MongoDB Example:**

```typescript
import { Authzkit, MongoConnection, MongoAuthzkitStore, IAuthzkitConfig } from 'node-authzkit';

const config: IAuthzkitConfig = {
  connection: {
    type: 'mongodb',
    uri: 'mongodb://localhost:27017',
    database: 'my_app_db'
  },
  models: { // Optional custom collection names
    users: 'users',
    roles: 'app_roles',
    permissions: 'app_permissions'
  }
};

async function init() {
  const mongoConnection = MongoConnection.getInstance(config);
  await mongoConnection.connect();
  
  const store = new MongoAuthzkitStore(mongoConnection);
  const authzkit = Authzkit.getInstance(store);
}
```

**PostgreSQL Example:**

```typescript
import { Authzkit, PgConnection, PgAuthzkitStore, IAuthzkitConfig } from 'node-authzkit';

const config: IAuthzkitConfig = {
  connection: {
    type: 'postgres',
    uri: 'postgresql://user:pass@localhost:5432/my_app_db'
  }
};

async function init() {
  const pgConnection = PgConnection.getInstance(config);
  await pgConnection.connect();
  await pgConnection.initSchema(); // Creates tables if they don't exist
  
  const store = new PgAuthzkitStore(pgConnection);
  const authzkit = Authzkit.getInstance(store);
}
```

### 3. Usage

```typescript
// Define
await authzkit.definePermission('edit_posts');
await authzkit.defineRole('editor', ['edit_posts']);

// Assign
const user = { id: 123 }; // Authorizable entity
await authzkit.assignRole(user, 'editor');

// Check
if (await authzkit.hasPermission(user, 'edit_posts')) {
  console.log('User can edit posts');
}
```

### 4. Express Middleware

```typescript
import { authorize } from 'node-authzkit';

app.post('/posts', authorize('edit_posts'), (req, res) => {
  // ...
});
```

## Dashboard

This project includes a built-in dashboard to manage Roles, Permissions, and User Assignments visually.

### Integration in Express

You can easily mount the dashboard into your existing Express application.

1.  **Install dependencies:**
    The dashboard requires `express` and `basic-auth`.
    ```bash
    pnpm install express basic-auth
    ```

2.  **Mount the Router:**
    ```typescript
    import express from 'express';
    import { Authzkit, InMemoryAuthzkitStore, createDashboardRouter } from 'node-authzkit';
    
    const app = express();
    const authzkit = Authzkit.getInstance(new InMemoryAuthzkitStore());

    // Mount the dashboard at /authzkit
    app.use('/authzkit', createDashboardRouter({
        authzkit, // Optional, defaults to singleton
        secret: 'supersecret', // Password for Basic Auth (User: admin)
        username: 'admin' // Optional, defaults to 'admin'
    }));
    
    app.listen(3000);
    ```

3.  **Access:**
    Go to `http://localhost:3000/authzkit/` and log in with the credentials you configured.

### Using Environment Variables

You can configure `node-authzkit` stores using environment variables.

1.  **Set Environment Variables:**
    ```bash
    # For MongoDB
    AUTHZKIT_CONNECTION_TYPE=mongodb
    AUTHZKIT_CONNECTION_URI=mongodb://localhost:27017/mydb
    AUTHZKIT_DB_NAME=mydb

    # For PostgreSQL
    AUTHZKIT_CONNECTION_TYPE=postgres
    AUTHZKIT_CONNECTION_URI=postgresql://user:pass@localhost:5432/mydb

    # For Dashboard Auth (Optional override)
    AUTHZKIT_DASHBOARD_USERNAME=adminuser
    AUTHZKIT_DASHBOARD_SECRET=mysecretpassword
    ```

2.  **Load Configuration:**
    ```typescript
    import { loadConfigFromEnv, MongoConnection, PgConnection, Authzkit, MongoAuthzkitStore, PgAuthzkitStore } from 'node-authzkit';

    const config = loadConfigFromEnv();

    if (config) {
        if (config.connection.type === 'mongodb') {
             const conn = MongoConnection.getInstance(config);
             await conn.connect();
             Authzkit.getInstance(new MongoAuthzkitStore(conn));
        } else if (config.connection.type === 'postgres') {
             const conn = PgConnection.getInstance(config);
             await conn.connect();
             Authzkit.getInstance(new PgAuthzkitStore(conn));
        }
    }
    ```

## API Documentation

### `Authzkit` Class

The main singleton class.

-   `static getInstance(store?: IAuthzkitStore): Authzkit`
-   `definePermission(name: string, guard_name?: string): Promise<Permission>`
-   `defineRole(name: string, permissions: string[], guard_name?: string): Promise<Role>`
-   `deletePermission(name: string): Promise<void>`
-   `deleteRole(name: string): Promise<void>`
-   `assignRole(authorizable: Authorizable, roleName: string): Promise<void>`
-   `assignPermission(authorizable: Authorizable, permissionName: string): Promise<void>`
-   `revokeRole(authorizable: Authorizable, roleName: string): Promise<void>`
-   `revokePermission(authorizable: Authorizable, permissionName: string): Promise<void>`
-   `hasRole(authorizable: Authorizable, roleName: string): Promise<boolean>`
-   `hasPermission(authorizable: Authorizable, permissionName: string): Promise<boolean>`
-   `getRoles(): Promise<Role[]>`
-   `getPermissions(): Promise<Permission[]>`
-   `getUserRoles(authorizable: Authorizable): Promise<Set<string>>`
-   `getUserPermissions(authorizable: Authorizable): Promise<Set<string>>`

## License

ISC
