import { readFileSync } from 'fs';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { DbConfig } from '../interfaces';
import { DumpMetadata } from '../../dumpMetadata/models/DumpMetadata';

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
  return createConnection(createConnectionOptions({ entities: ENTITIES_DIRS, ...dbConfig }));
};
