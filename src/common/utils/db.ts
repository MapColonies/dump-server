import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { DumpMetadata } from '../../dumpMetadata/models/dumpMetadata';

export const CHARACTER_LENGTH_LIMIT = 100;
export const BUCKET_NAME_LENGTH_LIMIT = 63;

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/*.ts'];

export const initializeConnection = async (): Promise<Connection> => {
  const connectionOptions = config.get<ConnectionOptions>('db');
  return createConnection({ entities: ENTITIES_DIRS, ...connectionOptions });
};
