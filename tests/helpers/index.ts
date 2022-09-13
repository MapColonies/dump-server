import { faker } from '@faker-js/faker';
import { omitBy, isNil } from 'lodash';
import { BUCKET_NAME_MIN_LENGTH_LIMIT } from '../../src/common/constants';
import { IObjectStorageConfig } from '../../src/common/interfaces';
import { isStringUndefinedOrEmpty } from '../../src/common/utils';

import { DumpMetadataResponse, DumpMetadata } from '../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadataFilterQueryParams } from '../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../src/dumpMetadata/models/dumpMetadataFilter';

interface IntegrationDumpMetadataResponse extends Omit<DumpMetadataResponse, 'timestamp'> {
  timestamp: string;
}

export const getMockObjectStorageConfig = (includeProjectId: boolean): IObjectStorageConfig => {
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

export const createFakeDumpMetadata = (): DumpMetadata => {
  const shouldContainDescription = faker.datatype.boolean();
  const shouldContainStateNumber = faker.datatype.boolean();

  const fakeDump: DumpMetadata = {
    id: faker.datatype.uuid(),
    name: faker.random.word(),
    bucket: faker.random.alpha({ count: BUCKET_NAME_MIN_LENGTH_LIMIT }),
    timestamp: createFakeDate(),
    description: shouldContainDescription ? faker.random.word() : undefined,
    stateNumber: shouldContainStateNumber ? faker.datatype.number({ min: 1 }) : undefined,
  };

  return fakeDump;
};

export const createMultipleFakeDumpsMetadata = (amount: number): DumpMetadata[] => {
  const fakeData: DumpMetadata[] = [];
  for (let i = 0; i < amount; i++) {
    fakeData.push(createFakeDumpMetadata());
  }
  return fakeData;
};

export const convertFakeToResponse = (fakeDumpMetadata: DumpMetadata, includeProjectId = true): DumpMetadataResponse => {
  const { bucket, ...restOfMetadata } = fakeDumpMetadata;
  const { protocol, host, projectId, port } = getMockObjectStorageConfig(includeProjectId);

  const url = isStringUndefinedOrEmpty(projectId)
    ? `${protocol}://${host}:${port}/${bucket}/${restOfMetadata.name}`
    : `${protocol}://${host}:${port}/${projectId}:${bucket}/${restOfMetadata.name}`;

  const nonNilMetadata = omitBy(restOfMetadata, isNil) as DumpMetadataResponse;
  return { ...nonNilMetadata, url };
};

export const convertFakesToResponses = (fakeDumpsMetadata: DumpMetadata[], includeProjectId = true): DumpMetadataResponse[] => {
  return fakeDumpsMetadata.map((fake) => convertFakeToResponse(fake, includeProjectId));
};

export const convertToISOTimestamp = (response: DumpMetadataResponse): IntegrationDumpMetadataResponse => {
  const { timestamp, ...rest } = response;
  return { ...rest, timestamp: timestamp.toISOString() };
};

export const getBaseFilterQueryParams = (): DumpMetadataFilterQueryParams => {
  return {
    sort: faker.datatype.boolean() ? 'asc' : 'desc',
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
