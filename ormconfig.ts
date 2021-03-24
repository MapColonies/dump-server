import config from 'config';
import { createConnectionOptions } from './src/common/db/connection';
import { DbConfig } from './src/common/interfaces';

const connectionOptions = config.get<DbConfig>('db');

module.exports = [
  {
    ...createConnectionOptions(connectionOptions),
    entities: ['src/dumpMetadata/models/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migrations/*.ts'],
    cli: {
      migrationsDir: 'db/migrations',
    },
  },
];
