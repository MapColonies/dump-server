import { container } from 'tsyringe';
import { Connection } from 'typeorm';
import { DumpMetadata } from '../../../../src/dumpMetadata/models/dumpMetadata';
import { createFakeDumpMetadata } from '../../../common/helpers/helpers';

export const createDbDumpMetadata = async (): Promise<DumpMetadata> => {
  const connection = container.resolve(Connection);
  const repository = connection.getRepository(DumpMetadata);
  const dumpMetadata = repository.create(createFakeDumpMetadata());
  const createdDumpMetadata = await repository.save(dumpMetadata);
  return createdDumpMetadata;
};
