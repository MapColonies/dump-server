import faker from 'faker';
import { BUCKET_NAME_MIN_LENGTH_LIMIT } from '../../src/common/constants';
import { IObjectStorageConfig } from '../../src/common/interfaces';

import { DumpMetadataResponse, IDumpMetadata } from '../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadataFilterQueryParams } from '../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../src/dumpMetadata/models/dumpMetadataFilter';

interface IntegrationDumpMetadataResponse extends Omit<DumpMetadataResponse, 'timestamp'> {
  timestamp: string;
}

export const getMockObjectStorageConfig = (includeProjectId = false): IObjectStorageConfig => {
  const objectStorageConfig: IObjectStorageConfig = { protocol: 'http', host: 'some_storage_host', port: '9000' };
  if (includeProjectId) {
    objectStorageConfig.projectId = 'some_project_id';
  }
  return objectStorageConfig;
};

export const DEFAULT_SORT = 'desc';

export const DEFAULT_LIMIT = 10;

export const BOTTOM_FROM = faker.date.past();

export const TOP_TO = faker.date.future();

export const createFakeDate = (): Date => {
  return faker.date.between(BOTTOM_FROM, TOP_TO);
};

export const createFakeDumpMetadata = (): IDumpMetadata => {
  return {
    id: faker.random.uuid(),
    name: faker.random.word(),
    bucket: faker.random.alpha({ count: BUCKET_NAME_MIN_LENGTH_LIMIT }),
    timestamp: createFakeDate(),
    description: faker.random.word(),
  };
};

export const createMultipleFakeDumpsMetadata = (amount: number): IDumpMetadata[] => {
  const fakeData: IDumpMetadata[] = [];
  for (let i = 0; i < amount; i++) {
    fakeData.push(createFakeDumpMetadata());
  }
  return fakeData;
};

export const convertFakeToResponse = (fakeDumpMetadata: IDumpMetadata, includeProjectId = true): DumpMetadataResponse => {
  const { bucket, ...restOfMetadata } = fakeDumpMetadata;
  const { protocol, host, projectId, port } = getMockObjectStorageConfig();

  let url = `${protocol}://${host}:${port}/${bucket}/${restOfMetadata.name}`;
  if (includeProjectId && projectId != undefined) {
    url = `${protocol}://${host}/${port}/${projectId}:${bucket}/${restOfMetadata.name}`;
  }

  return { ...restOfMetadata, url };
};

export const convertFakesToResponses = (fakeDumpsMetadata: IDumpMetadata[]): DumpMetadataResponse[] => {
  return fakeDumpsMetadata.map((fake) => convertFakeToResponse(fake));
};

export const convertToISOTimestamp = (response: DumpMetadataResponse): IntegrationDumpMetadataResponse => {
  const { timestamp, ...rest } = response;
  return { ...rest, timestamp: timestamp.toISOString() };
};

export const getDefaultFilterQueryParams = (): DumpMetadataFilterQueryParams => {
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
