import config from 'config';
import { ConnectionOptions } from 'typeorm';

const connectionOptions = config.get<ConnectionOptions>('db');

module.exports = [
  {
    ...connectionOptions,
    entities: ['src/dumpMetadata/models/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migrations/*.ts'],
    cli: {
      migrationsDir: 'db/migrations',
    },
  },
];
