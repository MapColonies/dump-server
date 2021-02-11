import faker from 'faker';
import { IDumpMetadata } from '../../../src/dumpMetadata/models/dumpMetadata';

export const createFakeUUID = (): string => {
  return faker.random.uuid();
};

export const createFakeString = (): string => {
  return faker.random.word();
};

export const createFakeDate = (): Date => {
  return faker.date.past();
};

export const createFakeDumpMetadata = (): IDumpMetadata => {
  return {
    id: createFakeUUID(),
    name: createFakeString(),
    bucket: createFakeString(),
    timestamp: createFakeDate(),
    description: createFakeString(),
  };
};
