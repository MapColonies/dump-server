import { container, DependencyContainer } from 'tsyringe';
import config from 'config';
import { Connection } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';

import { dumpMetadataRouterFactory } from '../../src/dumpMetadata/routes/dumpMetadataRouter';
import { Services } from '../../src/common/constants';
import { DbConfig } from '../../src/common/interfaces';
import { DumpMetadata } from '../../src/dumpMetadata/models/DumpMetadata';
import { initConnection } from '../../src/common/db/connection';
import { getMockObjectStorageConfig } from '../helpers';

async function registerTestValues(): Promise<DependencyContainer> {
  const child = container.createChildContainer();

  child.register(Services.CONFIG, { useValue: config });
  child.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });
  child.register(Services.OBJECT_STORAGE, { useValue: getMockObjectStorageConfig() });
  child.register('dumpsRouter', { useFactory: dumpMetadataRouterFactory });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection(connectionOptions);
  await connection.synchronize();

  const repository = connection.getRepository(DumpMetadata);
  child.register(Connection, { useValue: connection });
  child.register('DumpMetadataRepository', { useValue: repository });

  return child;
}

export { registerTestValues };
