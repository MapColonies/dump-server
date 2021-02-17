import faker from 'faker';

import { DumpMetadataResponse, IDumpMetadata } from '../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadataFilter } from '../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../src/dumpMetadata/models/dumpMetadataFilter';

interface IntegrationDumpMetadataResponese extends Omit<DumpMetadataResponse, 'timestamp'> {
  timestamp: string;
}

export const mockObjectStorageConfig = {
  protocol: 'http',
  host: 'some_storage_host',
};

export const DEFAULT_SORT = 'desc';

export const DEFAULT_LIMIT = 10;

export const BOTTOM_FROM = faker.date.past();

export const TOP_TO = faker.date.future(undefined, BOTTOM_FROM);

export const createFakeUUID = (): string => {
  return faker.random.uuid();
};

export const createFakeString = (): string => {
  return faker.random.word();
};

export const createFakeDate = (): Date => {
  return faker.date.between(BOTTOM_FROM, TOP_TO);
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

export const createMultipleFakeDumpsMetadata = (amount: number): IDumpMetadata[] => {
  const fakeData: IDumpMetadata[] = [];
  for (let i = 0; i < amount; i++) {
    fakeData.push(createFakeDumpMetadata());
  }
  return fakeData;
};

export const convertFakeToResponse = (fakeDumpMetadata: IDumpMetadata): DumpMetadataResponse => {
  const { bucket, ...restOfMetadata } = fakeDumpMetadata;
  const { protocol, host } = mockObjectStorageConfig;
  return { ...restOfMetadata, url: `${protocol}://${host}/${bucket}/${restOfMetadata.name}` };
};

export const convertFakesToResponses = (fakeDumpsMetadata: IDumpMetadata[]): DumpMetadataResponse[] => {
  return fakeDumpsMetadata.map((fake) => convertFakeToResponse(fake));
};

export const convertToISOTimestamp = (response: DumpMetadataResponse): IntegrationDumpMetadataResponese => {
  const { timestamp, ...rest } = response;
  return { ...rest, timestamp: timestamp.toISOString() };
};

export const getDefaultFilter = (): DumpMetadataFilter => {
  return {
    sort: DEFAULT_SORT,
    limit: DEFAULT_LIMIT,
  };
};

export const sortByOrderFilter = <T extends { timestamp: string | Date }>(data: T[], sort: SortFilter): T[] => {
  return data.sort((itemA, itemB) => {
    const dateA = +new Date(itemA.timestamp);
    const dateB = +new Date(itemB.timestamp);
    return sort === DEFAULT_SORT ? dateB - dateA : dateA - dateB;
  });
};
