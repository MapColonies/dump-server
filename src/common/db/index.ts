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
  const { ssl, host, port, username, password, database, schema } = dbConfig;
  const connectionOptions: ConnectionOptions = { type: 'postgres', host, port, username, password, database, schema, entities: ENTITIES_DIRS };

  if (ssl.enabled) {
    return {
      ...connectionOptions,
      password: undefined,
      ssl: {
        key: readFileSync(ssl.key),
        cert: readFileSync(ssl.cert),
        ...(ssl.ca !== undefined && { ca: readFileSync(ssl.ca) }),
      },
    };
  }

  return connectionOptions;
};

export const initConnection = async (dbConfig: DbConfig): Promise<Connection> => {
  if (connectionSingleton?.isConnected !== true) {
    const connectionOptions = createConnectionOptions(dbConfig);
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
  const connectionOptions = createConnectionOptions(dbConfig);
  return new Connection(connectionOptions);
};
