import { readFileSync } from 'fs';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { HealthCheck } from '@godaddy/terminus';
import { DependencyContainer, FactoryFunction } from 'tsyringe';
import { IConfig } from '../../common/interfaces';
import { DbConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/DAL/typeorm/dumpMetadata';
import { promiseTimeout } from '../utils/promiseTimeout';
import { DB_HEALTHCHECK_TIMEOUT_MS, Services } from '../constants';

let connectionSingleton: Connection | undefined;

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/DumpMetadata.ts'];

export const createConnectionOptions = (dbConfig: DbConfig): ConnectionOptions => {
  const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
  if (enableSslAuth && connectionOptions.type === 'postgres') {
    connectionOptions.password = undefined;
    connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
  }
  return connectionOptions;
};

export const initConnection = async (dbConfig: DbConfig): Promise<Connection> => {
  if (connectionSingleton === undefined || !connectionSingleton.isConnected) {
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
  const config = container.resolve<IConfig>(Services.CONFIG);
  const dbConfig = config.get<DbConfig>('db');
  const connectionOptions = createConnectionOptions({ entities: ENTITIES_DIRS, ...dbConfig });
  return new Connection(connectionOptions);
};
