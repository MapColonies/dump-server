import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { DumpMetadata } from '../../dumpMetadata/models/dumpMetadata';

export const ENTITIES_DIRS = [DumpMetadata, 'src/dumpMetadata/models/*.ts'];

export const initializeConnection = async (): Promise<Connection> => {
  const connectionOptions = config.get<ConnectionOptions>('db');
  return createConnection({ entities: ENTITIES_DIRS, ...connectionOptions });
};
