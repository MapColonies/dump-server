import { container } from 'tsyringe';
import config from 'config';
import { Connection } from 'typeorm';

import { Services } from '../../src/common/constants';
import { ILogger } from '../../src/common/interfaces';
import { DumpMetadata } from '../../src/dumpMetadata/models/dumpMetadata';
import { initializeConnection } from '../../src/common/utils/db';
import { mockObjectStorageConfig } from '../helpers';

async function registerTestValues(): Promise<void> {
  container.register(Services.CONFIG, { useValue: config });

  const mockLogger: ILogger = { log: jest.fn() };
  container.register(Services.LOGGER, { useValue: mockLogger });

  container.register(Services.OBJECT_STORAGE, { useValue: mockObjectStorageConfig });

  const connection = await initializeConnection();
  await connection.synchronize();
  const repository = connection.getRepository(DumpMetadata);
  container.register(Connection, { useValue: connection });
  container.register('DumpMetadataRepository', { useValue: repository });
}

export { registerTestValues };
