import config from 'config';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

const ENTITIES_DIRS = ['src/dumpMetadata/models/*.ts'];

export const initializeConnection = async (): Promise<Connection> => {
  const connectionOptions = config.get<ConnectionOptions>('db');
  const connection = await createConnection({ entities: ENTITIES_DIRS, ...connectionOptions });
  return connection;
};
