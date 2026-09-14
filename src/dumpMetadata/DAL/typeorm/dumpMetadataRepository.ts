import type { Connection, Repository } from 'typeorm';
import type { FactoryFunction } from 'tsyringe';
import { DB_CONNECTION_PROVIDER } from '@common/db';
import { DumpMetadata } from './dumpMetadata';

export const DUMP_METADATA_REPOSITORY_SYMBOL = Symbol('dumpMetadataRepository');

export const dumpMetadataRepositoryFactory: FactoryFunction<Repository<DumpMetadata>> = (container) => {
  const connection = container.resolve<Connection>(DB_CONNECTION_PROVIDER);
  return connection.getRepository(DumpMetadata);
};
