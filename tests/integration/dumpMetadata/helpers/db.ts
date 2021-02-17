import { container } from 'tsyringe';
import { Connection, EntityTarget, Repository } from 'typeorm';

import { DumpMetadata } from '../../../../src/dumpMetadata/models/dumpMetadata';
import { createMultipleFakeDumpsMetadata } from '../../../helpers';

export const getRepositoryFromContainer = <T>(target: EntityTarget<T>): Repository<T> => {
  const connection = container.resolve(Connection);
  return connection.getRepository<T>(target);
};

export const generateDumpsMetadataOnDb = async (amount: number): Promise<DumpMetadata[]> => {
  const repository = getRepositoryFromContainer(DumpMetadata);
  const createdDumpsMetadata = repository.create(createMultipleFakeDumpsMetadata(amount));
  return repository.save(createdDumpsMetadata);
};
