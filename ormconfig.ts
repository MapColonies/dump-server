import config from 'config';
import { createConnectionOptions } from './src/common/db';
import { DbConfig } from './src/common/interfaces';

// The typeorm CLI cannot await the async application config, so the db section is loaded here
// with node-config directly (a transitive dependency of @map-colonies/config), reusing the same
// config files and the env overrides defined in config/custom-environment-variables.json.
const connectionOptions = config.get<DbConfig>('db');

module.exports = [
  {
    ...createConnectionOptions(connectionOptions),
    entities: ['src/**/DAL/typeorm/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migrations/*.ts'],
    cli: {
      migrationsDir: 'db/migrations',
    },
  },
];
