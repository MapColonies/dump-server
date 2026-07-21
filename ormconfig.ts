import { createConnectionOptions } from './src/common/db';
import type { DbConfig } from './src/common/interfaces';
import { initConfig, getConfig } from './src/common/config';

module.exports = (async () => {
  await initConfig();
  const dbConfig = getConfig().get('db');

  return [
    {
      ...createConnectionOptions(dbConfig),
      entities: ['src/**/DAL/typeorm/*.ts'],
      migrationsTableName: 'custom_migration_table',
      migrations: ['db/migrations/*.ts'],
      cli: { migrationsDir: 'db/migrations' },
    },
  ];
})();
