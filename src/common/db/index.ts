import { hostname } from 'os';
import { readFileSync } from 'fs';
import { TlsOptions } from 'tls';
import { DataSourceOptions, DataSource } from 'typeorm';
import { HealthCheck } from '@godaddy/terminus';
import { FactoryFunction } from 'tsyringe';
import { DbCommonConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/DAL/typeorm/dumpMetadata';
import { promiseTimeout } from '../utils/promiseTimeout';
import { DB_HEALTHCHECK_TIMEOUT_MS } from '../constants';
import { getConfig } from '../config';

let connectionSingleton: DataSource | undefined;

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/DumpMetadata.ts'];
export const DATA_SOURCE_PROVIDER = Symbol('dataSourceProvider');

/**
 * A helper function that creates the typeorm DataSource options to use for creating a new DataSource.
 * Handles SSL and registration of all required entities and migrations.
 * @param dbConfig The typeorm postgres configuration with added SSL options.
 * @returns Options object ready to use with typeorm.
 */
export const createConnectionOptions = (dbConfig: DbCommonConfig): DataSourceOptions => {
  let ssl: TlsOptions | undefined = undefined;
  const { ssl: inputSsl, ...dataSourceOptions } = dbConfig;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  //dataSourceOptions.extra = { application_name: `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}` };
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
    connectionSingleton = new DataSource(createConnectionOptions(dbConfig));
    try {
      await connectionSingleton.initialize();
    } catch (error) {
      console.log("ERROR: \n", error);
      throw error;
    }
  }
  console.log("BLA");
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

export const dataSourceFactory: FactoryFunction<DataSource> = (): DataSource => {
  const config = getConfig();
  const dbConfig = config.get('db');

  const dataSourceOptions = createConnectionOptions(dbConfig);
  return new DataSource(dataSourceOptions);
};
