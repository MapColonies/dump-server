import { readFileSync } from 'node:fs';
import type { ConnectionOptions } from 'typeorm';
import { Connection, createConnection } from 'typeorm';
import type { HealthCheck } from '@godaddy/terminus';
import type { DependencyContainer, FactoryFunction } from 'tsyringe';
import type { ConfigType } from '../config';
import type { DbConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/DAL/typeorm/dumpMetadata';
import { promiseTimeout } from '../utils/promiseTimeout';
import { DB_HEALTHCHECK_TIMEOUT_MS, SERVICES } from '../constants';

let connectionSingleton: Connection | undefined;

export const ENTITIES_DIRS = [DumpMetadata];

export const createConnectionOptions = (dbConfig: DbConfig): ConnectionOptions => {
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
  if (enableSslAuth && connectionOptions.type === 'postgres') {
    connectionOptions.password = undefined;
    connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return connectionOptions;
};

export const initConnection = async (dbConfig: DbConfig): Promise<Connection> => {
  if (connectionSingleton?.isConnected !== true) {
    const connectionOptions = createConnectionOptions({ entities: ENTITIES_DIRS, ...dbConfig });
    connectionSingleton = await createConnection(connectionOptions);
  }
  return connectionSingleton;
};

export const getDbHealthCheckFunction = (connection: Connection): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_HEALTHCHECK_TIMEOUT_MS, check);
  };
};

export const connectionFactory: FactoryFunction<Connection> = (container: DependencyContainer): Connection => {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig: DbConfig = config.get('db');
  const connectionOptions = createConnectionOptions({ entities: ENTITIES_DIRS, ...dbConfig });
  return new Connection(connectionOptions);
};
