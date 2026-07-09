import { readFileSync } from 'node:fs';
import { createConnectionOptions } from './src/common/db';
import type { DbConfig } from './src/common/interfaces';

// The typeorm CLI cannot await the async application config, so the db section is read directly
// from the local config file, honoring the same DB_* env overrides the schema defines for the application.
const { db } = JSON.parse(readFileSync('./config/default.json', 'utf8')) as { db: DbConfig };
const env = process.env;

const sslEnabled = env.DB_ENABLE_SSL_AUTH !== undefined ? env.DB_ENABLE_SSL_AUTH === 'true' : db.ssl.enabled;

const dbConfig: DbConfig = {
  ...db,
  ...(env.DB_HOST !== undefined && { host: env.DB_HOST }),
  ...(env.DB_PORT !== undefined && { port: parseInt(env.DB_PORT, 10) }),
  ...(env.DB_USERNAME !== undefined && { username: env.DB_USERNAME }),
  ...(env.DB_PASSWORD !== undefined && { password: env.DB_PASSWORD }),
  ...(env.DB_NAME !== undefined && { database: env.DB_NAME }),
  ...(env.DB_SCHEMA !== undefined && { schema: env.DB_SCHEMA }),
  ssl: {
    enabled: sslEnabled,
    ca: env.DB_CA_PATH ?? db.ssl.ca,
    cert: env.DB_CERT_PATH ?? db.ssl.cert,
    key: env.DB_KEY_PATH ?? db.ssl.key,
  } as DbConfig['ssl'],
};

module.exports = [
  {
    ...createConnectionOptions(dbConfig),
    entities: ['src/**/DAL/typeorm/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migrations/*.ts'],
    cli: {
      migrationsDir: 'db/migrations',
    },
  },
];
