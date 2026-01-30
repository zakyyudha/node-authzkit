import { IAuthzkitConfig } from '../interfaces/IAuthzkitConfig';

export function loadConfigFromEnv(): IAuthzkitConfig | null {
  const type = process.env.AUTHZKIT_CONNECTION_TYPE;
  const uri = process.env.AUTHZKIT_CONNECTION_URI;
  const dbName = process.env.AUTHZKIT_DB_NAME;

  if (!type && !uri) {
    return null; // No config found in env
  }

  const models = {
    users: process.env.AUTHZKIT_MODEL_USERS,
    roles: process.env.AUTHZKIT_MODEL_ROLES,
    permissions: process.env.AUTHZKIT_MODEL_PERMISSIONS,
    user_roles: process.env.AUTHZKIT_MODEL_USER_ROLES,
    user_permissions: process.env.AUTHZKIT_MODEL_USER_PERMISSIONS,
  };

  // Filter undefined models
  const cleanModels: any = {};
  for (const [key, value] of Object.entries(models)) {
    if (value) cleanModels[key] = value;
  }

  if (type === 'mongodb') {
    return {
      connection: {
        type: 'mongodb',
        uri: uri || '',
        database: dbName,
      },
      models: Object.keys(cleanModels).length > 0 ? cleanModels : undefined,
    };
  } else if (type === 'postgres') {
    return {
      connection: {
        type: 'postgres',
        uri: uri || '',
        database: dbName, // Optional for PG connection string usually includes it
      },
      models: Object.keys(cleanModels).length > 0 ? cleanModels : undefined,
    };
  }

  // Default fallback if type isn't explicit but URI is present, could try to guess, but stricter is better.
  if (uri) {
    if (uri.startsWith('mongodb')) {
      return {
        connection: {
          type: 'mongodb',
          uri: uri,
          database: dbName,
        },
        models: Object.keys(cleanModels).length > 0 ? cleanModels : undefined,
      };
    }
    if (uri.startsWith('postgres')) {
      return {
        connection: {
          type: 'postgres',
          uri: uri,
        },
        models: Object.keys(cleanModels).length > 0 ? cleanModels : undefined,
      };
    }
  }

  return null;
}
