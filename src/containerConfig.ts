import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import { Connection } from 'typeorm';
import config from 'config';
import { Probe } from '@map-colonies/mc-probe';
import { MCLogger, ILoggerConfig, IServiceConfig } from '@map-colonies/mc-logger';

import { Services } from './common/constants';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { DB_TIMEOUT } from './common/constants';
import { DumpMetadata } from './dumpMetadata/models/dumpMetadata';
import { DbConfig, IObjectStorageConfig } from './common/interfaces';
import { initConnection } from './common/db/connection';

const healthCheck = (connection: Connection): (() => Promise<void>) => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_TIMEOUT, check);
  };
};

const beforeShutdown = (connection: Connection): (() => Promise<void>) => {
  return async (): Promise<void> => {
    await connection.close();
  };
};

async function registerExternalValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });

  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;

  const loggerConfig = config.get<ILoggerConfig>('logger');
  const logger = new MCLogger(loggerConfig, service);
  container.register(Services.LOGGER, { useValue: logger });

  const objectStorageConfig = config.get<IObjectStorageConfig>('objectStorage');
  container.register(Services.OBJECT_STORAGE, { useValue: objectStorageConfig });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection(connectionOptions);
  container.register(Connection, { useValue: connection });
  container.register('DumpMetadataRepository', { useValue: connection.getRepository(DumpMetadata) });

  container.register<Probe>(Probe, {
    useFactory: (container) =>
      new Probe(container.resolve(Services.LOGGER), { liveness: healthCheck(connection), beforeShutdown: beforeShutdown(connection) }),
  });
}

export { registerExternalValues };
