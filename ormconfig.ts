import config from 'config';
import { ConnectionOptions } from 'typeorm';
import { ENTITIES_DIRS } from './src/common/utils/db';

const connectionOptions = config.get<ConnectionOptions>('db');

module.exports = [
  {
    ...connectionOptions,
    entities: ENTITIES_DIRS,
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migrations/*.ts'],
    cli: {
      migrationsDir: 'db/migrations',
    },
  },
];
