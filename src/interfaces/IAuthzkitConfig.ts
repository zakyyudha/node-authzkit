export interface IAuthzkitConfig {
  connection: {
    type: 'mongodb' | 'postgres' | 'memory';
    uri?: string; // For MongoDB and Postgres
    database?: string; // For MongoDB
    // Postgres specific
    host?: string;
    port?: number;
    user?: string;
    password?: string;
  };
  models?: {
    users?: string; // Table/Collection name for users (default: 'users')
    roles?: string; // Table/Collection name for roles (default: 'roles')
    permissions?: string; // Table/Collection name for permissions (default: 'permissions')
    user_roles?: string; // Table/Collection name for user-role relation (default: 'user_roles')
    user_permissions?: string; // Table/Collection name for user-permission relation (default: 'user_permissions')
  };
}
