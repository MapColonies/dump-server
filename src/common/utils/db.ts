import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { DumpMetadata } from '../../dumpMetadata/models/dumpMetadata';

export const NAME_LENGTH_LIMIT = 100;
export const BUCKET_NAME_LENGTH_LIMIT = 63;
export const BUCKET_NAME_MIN_LENGTH_LIMIT = 3;
export const DESCRIPTION_LENGTH_LIMIT = 256;

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/*.ts'];

export const initializeConnection = async (): Promise<Connection> => {
  const connectionOptions = config.get<ConnectionOptions>('db');
  return createConnection({ entities: ENTITIES_DIRS, ...connectionOptions });
};
