import { hostname } from 'os';
import { readFileSync } from 'fs';
import { TlsOptions } from 'tls';
import { DataSourceOptions, DataSource } from 'typeorm';
import { HealthCheck } from '@godaddy/terminus';
import { DependencyContainer, FactoryFunction } from 'tsyringe';
import { DbCommonConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/DAL/typeorm/dumpMetadata';
import { promiseTimeout } from '../utils/promiseTimeout';
import { DB_HEALTHCHECK_TIMEOUT_MS, SERVICES } from '../constants';
import { ConfigType } from '../config';

let connectionSingleton: DataSource | undefined;

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/DumpMetadata.ts'];

/**
 * A helper function that creates the typeorm DataSource options to use for creating a new DataSource.
 * Handles SSL and registration of all required entities and migrations.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Options object ready to use with typeorm.
 */
export const createDataSourceOptions = (dbConfig: DbCommonConfig): DataSourceOptions => {
  let ssl: TlsOptions | undefined = undefined;
  const { ssl: inputSsl, ...dataSourceOptions } = dbConfig;

  if (inputSsl.enabled) {
    ssl = { key: readFileSync(inputSsl.key), cert: readFileSync(inputSsl.cert), ca: readFileSync(inputSsl.ca) };
  }
  return {
    ...dataSourceOptions,
    type: 'postgres',
    entities: [...ENTITIES_DIRS, '**/models/*.js'],
    ssl,
    applicationName: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`,
  };
};

export const initConnection = async (dbConfig: DbCommonConfig): Promise<DataSource> => {
  if (connectionSingleton === undefined || !connectionSingleton.isInitialized) {
    connectionSingleton = new DataSource(createDataSourceOptions(dbConfig));
    await connectionSingleton.initialize();
  }
  return connectionSingleton;
};

export const getDbHealthCheckFunction = (connection: DataSource): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_HEALTHCHECK_TIMEOUT_MS, check);
  };
};

export const dataSourceFactory: FactoryFunction<DataSource> = (container: DependencyContainer): DataSource => {
  const config = container.resolve<ConfigType>(SERVICES.CONFIG);
  const dbConfig = config.get('db');

  const dataSourceOptions = createDataSourceOptions(dbConfig);
  return new DataSource(dataSourceOptions);
};
