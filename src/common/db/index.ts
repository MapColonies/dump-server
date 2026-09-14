import { readFileSync } from 'node:fs';
import type { ConnectionOptions } from 'typeorm';
import { Connection, createConnection } from 'typeorm';
import type { HealthCheck } from '@godaddy/terminus';
import type { DependencyContainer, FactoryFunction } from 'tsyringe';
import type { ConfigType } from '../config';
import type { DbConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/DAL/typeorm/dumpMetadata';
import { promiseTimeout } from '../utils/promiseTimeout';
import { SERVICES } from '../constants';

let connectionSingleton: Connection | undefined;

const readSslFileSync = (kind: 'ca' | 'cert' | 'key', path: string): Buffer => {
  try {
    return readFileSync(path);
  } catch (error) {
    throw new Error(`failed reading the database ssl ${kind} file at '${path}', check the db.ssl configuration`, { cause: error });
  }
};

export const ENTITIES_DIRS = [DumpMetadata];

export const DB_CONNECTION_PROVIDER = Symbol('dbConnectionProvider');

export const healthCheckFactory: FactoryFunction<HealthCheck> = (container) => {
  const connection = container.resolve<Connection>(DB_CONNECTION_PROVIDER);
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const { healthCheckTimeoutMs } = config.get('db');
  return getDbHealthCheckFunction(connection, healthCheckTimeoutMs);
};

export const createConnectionOptions = (dbConfig: DbConfig): ConnectionOptions => {
  const { ssl, host, port, username, password, database, schema } = dbConfig;
  const connectionOptions: ConnectionOptions = { type: 'postgres', host, port, username, password, database, schema, entities: ENTITIES_DIRS };

  if (ssl.enabled) {
    return {
      ...connectionOptions,
      password: undefined,
      ssl: {
        key: readSslFileSync('key', ssl.key),
        cert: readSslFileSync('cert', ssl.cert),
        ...(ssl.ca !== undefined && { ca: readSslFileSync('ca', ssl.ca) }),
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

export const getDbHealthCheckFunction = (connection: Connection, timeoutMs: number): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(timeoutMs, check);
  };
};

export const connectionFactory: FactoryFunction<Connection> = (container: DependencyContainer): Connection => {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db');
  const connectionOptions = createConnectionOptions(dbConfig);
  return new Connection(connectionOptions);
};
