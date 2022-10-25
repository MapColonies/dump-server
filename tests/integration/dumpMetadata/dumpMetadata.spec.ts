import config from 'config';
import { Connection, QueryFailedError, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import httpStatusCodes from 'http-status-codes';
import { Application } from 'express';
import { isWithinInterval, isAfter, isBefore } from 'date-fns';
import { omitBy, isNil } from 'lodash';
import { DependencyContainer } from 'tsyringe';
import { DumpMetadataCreation } from '../../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadata, DUMP_METADATA_REPOSITORY_SYMBOL } from '../../../src/dumpMetadata/DAL/typeorm/dumpMetadata';
import { getApp } from '../../../src/app';
import {
  getBaseFilterQueryParams,
  sortByOrderFilter,
  DEFAULT_LIMIT,
  DEFAULT_SORT,
  TOP_TO,
  BOTTOM_FROM,
  createFakeDate,
  convertFakesToResponses,
  convertFakeToResponse,
  convertToISOTimestamp,
  createFakeDumpMetadata,
  getMockObjectStorageConfig,
} from '../../helpers';
import { DbConfig } from '../../../src/common/interfaces';
import { DumpMetadataFilterQueryParams } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { initConnection } from '../../../src/common/db';
import {
  BUCKET_NAME_LENGTH_LIMIT,
  BUCKET_NAME_MIN_LENGTH_LIMIT,
  DESCRIPTION_LENGTH_LIMIT,
  NAME_LENGTH_LIMIT,
  Services,
} from '../../../src/common/constants';
import { DumpMetadataRequestSender } from './helpers/requestSender';
import { BAD_PATH, BEFORE_ALL_TIMEOUT, generateDumpsMetadataOnDb, getBaseRegisterOptions, HAPPY_PATH, SAD_PATH } from './helpers';

describe('dumps', function () {
  let container: DependencyContainer;
  let app: Application;
  let connection: Connection;
  let repository: Repository<DumpMetadata>;
  let requestSender: DumpMetadataRequestSender;
  let mockRequestSender: DumpMetadataRequestSender;

  beforeAll(async function () {
    const connectionOptions = config.get<DbConfig>('db');
    connection = await initConnection(connectionOptions);
    await connection.synchronize();
    repository = connection.getRepository(DumpMetadata);
    await repository.delete({});

    const registerOptions = getBaseRegisterOptions();
    registerOptions.override.push({ token: Connection, provider: { useValue: connection } });
    registerOptions.override.push({ token: Services.OBJECT_STORAGE, provider: { useValue: getMockObjectStorageConfig(true) } });

    [container, app] = await getApp(registerOptions);
    requestSender = new DumpMetadataRequestSender(app);
  }, BEFORE_ALL_TIMEOUT);

  afterEach(async function () {
    await repository.clear();
  });

  afterAll(async function () {
    await connection.close();
    container.reset();
  });
  describe('GET /dumps', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dumps queried by the default filter with given empty filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT + 1);

        const fakeResponses = convertFakesToResponses(fakeData);

        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter({});

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, DEFAULT_SORT).slice(0, DEFAULT_LIMIT));
      });

      it('should return 200 status code and the dumps queried by filter', async function () {
        const from = createFakeDate();
        const to = faker.date.between(from, TOP_TO);
        const filter: DumpMetadataFilterQueryParams = { limit: DEFAULT_LIMIT, sort: 'asc', from: from.toISOString(), to: to.toISOString() };

        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT + 1);

        // filter by times
        const fakeDataFiltered = fakeData.filter((fakeDump) => isWithinInterval(fakeDump.timestamp, { start: from, end: to }));

        // convert to responses
        const fakeResponses = convertFakesToResponses(fakeDataFiltered);

        // convert timestamp from date to string
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        // sort
        const sortedResponses = sortByOrderFilter(integrationDumpsMetadata, filter.sort);

        // limit
        const limitedResponses = sortedResponses.slice(0, filter.limit);

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(limitedResponses);
      });

      it('should return 200 status code and the less than requested limit if there are less in db', async function () {
        const amountOfDumpsToCreate = DEFAULT_LIMIT - 1;
        const fakeData = await generateDumpsMetadataOnDb(repository, amountOfDumpsToCreate);

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const { sort, limit } = getBaseFilterQueryParams();
        const response = await requestSender.getDumpsMetadataByFilter({ sort, limit });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(amountOfDumpsToCreate);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, sort));
      });

      it('should return 200 status code and only the top requested limit by the requested sort', async function () {
        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT + 1);
        const filter = getBaseFilterQueryParams();

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort).slice(0, DEFAULT_LIMIT));
      });

      it('should return 200 status code and empty response when requesting filter with a later from than to', async function () {
        await generateDumpsMetadataOnDb(repository, 1);
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), from: TOP_TO.toISOString(), to: BOTTOM_FROM.toISOString() };

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject([]);
      });

      it('should return 200 status code and response with only dumps correlating to the from filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT);

        const from = createFakeDate();
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), from: from.toISOString() };

        const dataFilteredByTime = fakeData.filter((dump) => isAfter(dump.timestamp, from));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and response with only dumps correlating to the to filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT);
        const to = createFakeDate();
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), to: to.toISOString() };

        const dataFilteredByTime = fakeData.filter((dump) => isBefore(dump.timestamp, to));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and the data should be sorted ascending', async function () {
        const fakeData = await generateDumpsMetadataOnDb(repository, DEFAULT_LIMIT);
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), sort: 'asc' };

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, 'asc'));
      });

      it('should return 200 status code and empty response when there is no data on db', async function () {
        const response = await requestSender.getDumpsMetadataByFilter({});

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject([]);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code for an invalid sort', async function () {
        const filter = getBaseFilterQueryParams();
        filter.sort = 'fake' as SortFilter;

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.sort should be equal to one of the allowed values: asc, desc');
      });

      it('should return 400 status code for an invalid limit lower than 1', async function () {
        const filter = { ...getBaseFilterQueryParams(), limit: 0 };

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be >= 1');
      });

      it('should return 400 status code for an invalid limit greater than 100', async function () {
        const filter = { ...getBaseFilterQueryParams(), limit: 101 };

        const response = await requestSender.getDumpsMetadataByFilter(filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be <= 100');
      });
    });

    describe(`${SAD_PATH}`, function () {
      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));
        const mockRegisterOptions = getBaseRegisterOptions();
        mockRegisterOptions.override.push({
          token: DUMP_METADATA_REPOSITORY_SYMBOL,
          provider: { useValue: { find: findMock } },
        });

        const [, mockApp] = await getApp(mockRegisterOptions);
        mockRequestSender = new DumpMetadataRequestSender(mockApp);

        const response = await mockRequestSender.getDumpsMetadataByFilter({});

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });

  describe('GET /dumps/:dumpId', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dump metadata', async function () {
        const fakeDumpMetadata = (await generateDumpsMetadataOnDb(repository, 1))[0];

        const dumpResponse = convertFakeToResponse(fakeDumpMetadata);
        const integrationDumpMetadata = convertToISOTimestamp(dumpResponse);

        const response = await requestSender.getDumpMetadataById(fakeDumpMetadata.id);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(integrationDumpMetadata);
      });

      it('should return 200 status code and the dump metadata without projectId', async function () {
        const fakeDumpMetadata = (await generateDumpsMetadataOnDb(repository, 1))[0];

        const dumpResponse = convertFakeToResponse(fakeDumpMetadata, false);
        const integrationDumpMetadata = convertToISOTimestamp(dumpResponse);

        const mockRegisterOptions = getBaseRegisterOptions();
        mockRegisterOptions.override.push({ token: Services.OBJECT_STORAGE, provider: { useValue: getMockObjectStorageConfig(false) } });
        const [, mockApp] = await getApp(mockRegisterOptions);
        mockRequestSender = new DumpMetadataRequestSender(mockApp);
        const response = await mockRequestSender.getDumpMetadataById(fakeDumpMetadata.id);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(integrationDumpMetadata);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code and that the given id is not valid', async function () {
        const response = await requestSender.getDumpMetadataById(faker.random.word());

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.params.dumpId should match format "uuid"');
      });
    });

    describe(`${SAD_PATH}`, function () {
      it('should return 404 status code if a dump with the requested id does not exist', async function () {
        const response = await requestSender.getDumpMetadataById(faker.datatype.uuid());

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', "Couldn't find dump with the given id.");
      });

      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findOneMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));

        const mockRegisterOptions = getBaseRegisterOptions();
        mockRegisterOptions.override.push({
          token: DUMP_METADATA_REPOSITORY_SYMBOL,
          provider: { useValue: { findOne: findOneMock } },
        });

        const [, mockApp] = await getApp(mockRegisterOptions);
        mockRequestSender = new DumpMetadataRequestSender(mockApp);

        const response = await mockRequestSender.getDumpMetadataById(faker.datatype.uuid());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });

  describe('POST /dumps', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 201 status code and create the dump on the db', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump(dumpCreationBody);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code if the name is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, name, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump({ ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'name'");
      });

      it('should return 400 status code if the bucket is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, bucket, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump({ ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'bucket'");
      });

      it('should return 400 status code if the timestamp is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, timestamp, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump({ ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'timestamp'");
      });

      it('should return 400 status code if the timestamp is not in a utc format', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump({ ...dumpCreationBody, timestamp: faker.random.word() as unknown as Date });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.body.timestamp should match format "date-time"');
      });

      it(`should return 400 status code if the name is longer than ${NAME_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump({ ...dumpCreationBody, name: faker.random.alpha({ count: NAME_LENGTH_LIMIT + 1 }) });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.name should NOT be longer than ${NAME_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the bucket is longer than ${BUCKET_NAME_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump({
          ...dumpCreationBody,
          bucket: faker.random.alpha({ count: BUCKET_NAME_LENGTH_LIMIT + 1 }),
        });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.bucket should NOT be longer than ${BUCKET_NAME_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the bucket is shorter than ${BUCKET_NAME_MIN_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump({ ...dumpCreationBody, bucket: faker.lorem.word(BUCKET_NAME_MIN_LENGTH_LIMIT - 1) });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.bucket should NOT be shorter than ${BUCKET_NAME_MIN_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the description is longer than ${DESCRIPTION_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump({
          ...dumpCreationBody,
          description: faker.random.alpha({ count: DESCRIPTION_LENGTH_LIMIT + 1 }),
        });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.description should NOT be longer than ${DESCRIPTION_LENGTH_LIMIT} characters`);
      });

      it('should return 422 status code if a dump with the same name already exists on the bucket', async function () {
        let fakeDump = (await generateDumpsMetadataOnDb(repository, 1))[0];
        fakeDump = omitBy(fakeDump, isNil) as DumpMetadata;

        const response = await requestSender.createDump(fakeDump);
        expect(response.status).toBe(httpStatusCodes.UNPROCESSABLE_ENTITY);
        expect(response.body).toHaveProperty(
          'message',
          `dump metadata on bucket: ${fakeDump.bucket} with the name: ${fakeDump.name} already exists.`
        );
      });
    });

    describe(`${SAD_PATH}`, function () {
      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const insertMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));

        const mockRegisterOptions = getBaseRegisterOptions();
        mockRegisterOptions.override.push({
          token: DUMP_METADATA_REPOSITORY_SYMBOL,
          provider: { useValue: { findOne: jest.fn(), insert: insertMock } },
        });

        const [, mockApp] = await getApp(mockRegisterOptions);
        mockRequestSender = new DumpMetadataRequestSender(mockApp);

        const response = await mockRequestSender.createDump(createFakeDumpMetadata());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });
});
