import { DependencyContainer } from 'tsyringe';
import { Connection, EntityTarget, Repository } from 'typeorm';

import { DumpMetadata } from '../../../../src/dumpMetadata/DAL/typeorm/dumpMetadata';
import { createMultipleFakeDumpsMetadata } from '../../../helpers';

export const getRepositoryFromContainer = <T>(container: DependencyContainer, target: EntityTarget<T>): Repository<T> => {
  const connection = container.resolve(Connection);
  return connection.getRepository<T>(target);
};

export const generateDumpsMetadataOnDb = async (childContainer: DependencyContainer, amount: number): Promise<DumpMetadata[]> => {
  const repository = getRepositoryFromContainer(childContainer, DumpMetadata);
  const createdDumpsMetadata = repository.create(createMultipleFakeDumpsMetadata(amount));
  return repository.save(createdDumpsMetadata);
};
