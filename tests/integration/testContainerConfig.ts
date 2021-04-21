import { container } from 'tsyringe';
import config from 'config';
import { Connection } from 'typeorm';

import { Services } from '../../src/common/constants';
import { DbConfig, ILogger } from '../../src/common/interfaces';
import { DumpMetadata } from '../../src/dumpMetadata/models/dumpMetadata';
import { initConnection } from '../../src/common/db/connection';
import { getMockObjectStorageConfig } from '../helpers';

async function registerTestValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });

  const mockLogger: ILogger = { log: jest.fn() };
  container.register(Services.LOGGER, { useValue: mockLogger });

  container.register(Services.OBJECT_STORAGE, { useValue: getMockObjectStorageConfig() });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection(connectionOptions);
  await connection.synchronize();
  const repository = connection.getRepository(DumpMetadata);
  container.register(Connection, { useValue: connection });
  container.register('DumpMetadataRepository', { useValue: repository });
}

export { registerTestValues };
