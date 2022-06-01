import { Application } from 'express';
import { container, DependencyContainer } from 'tsyringe';
import { QueryFailedError, Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import httpStatusCodes from 'http-status-codes';
import { isWithinInterval, isAfter, isBefore } from 'date-fns';

import { DumpMetadataCreation } from '../../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadata } from '../../../src/dumpMetadata/DAL/typeorm/dumpMetadata';
import { registerTestValues } from '../testContainerConfig';
import { HAPPY_PATH, SAD_PATH, BAD_PATH } from '../constants';
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
} from '../../helpers';
import { DumpMetadataFilterQueryParams } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { BUCKET_NAME_LENGTH_LIMIT, BUCKET_NAME_MIN_LENGTH_LIMIT, DESCRIPTION_LENGTH_LIMIT, NAME_LENGTH_LIMIT } from '../../../src/common/constants';
import { generateDumpsMetadataOnDb } from './helpers/db';
import * as requestSender from './helpers/requestSender';
import { getRepositoryFromContainer } from './helpers/db';

let app: Application;
let appWithoutProjectId: Application;
let repository: Repository<DumpMetadata>;
let childContainer: DependencyContainer;

describe('dumps', function () {
  beforeAll(async function () {
    childContainer = await registerTestValues();
    app = requestSender.getApp(childContainer);
    repository = getRepositoryFromContainer(childContainer, DumpMetadata);
    await repository.clear();
  });
  afterEach(async function () {
    await repository.clear();
  });
  afterAll(function () {
    container.reset();
  });
  describe('GET /dumps', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dumps queried by the default filter with given empty filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT + 1);

        const fakeResponses = convertFakesToResponses(fakeData);

        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, {});

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, DEFAULT_SORT).slice(0, DEFAULT_LIMIT));
      });

      it('should return 200 status code and the dumps queried by filter', async function () {
        const from = createFakeDate();
        const to = faker.date.between(from, TOP_TO);
        const filter: DumpMetadataFilterQueryParams = { limit: DEFAULT_LIMIT, sort: 'asc', from: from.toISOString(), to: to.toISOString() };

        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT + 1);

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

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(limitedResponses);
      });

      it('should return 200 status code and the less than requested limit if there are less in db', async function () {
        const amountOfDumpsToCreate = DEFAULT_LIMIT - 1;
        const fakeData = await generateDumpsMetadataOnDb(childContainer, amountOfDumpsToCreate);

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const { sort, limit } = getBaseFilterQueryParams();
        const response = await requestSender.getDumpsMetadataByFilter(app, { sort, limit });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(amountOfDumpsToCreate);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, sort));
      });

      it('should return 200 status code and only the top requested limit by the requested sort', async function () {
        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT + 1);
        const filter = getBaseFilterQueryParams();

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort).slice(0, DEFAULT_LIMIT));
      });

      it('should return 200 status code and empty response when requesting filter with a later from than to', async function () {
        await generateDumpsMetadataOnDb(childContainer, 1);
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), from: TOP_TO.toISOString(), to: BOTTOM_FROM.toISOString() };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject([]);
      });

      it('should return 200 status code and response with only dumps correlating to the from filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT);

        const from = createFakeDate();
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), from: from.toISOString() };

        const dataFilteredByTime = fakeData.filter((dump) => isAfter(dump.timestamp, from));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and response with only dumps correlating to the to filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT);
        const to = createFakeDate();
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), to: to.toISOString() };

        const dataFilteredByTime = fakeData.filter((dump) => isBefore(dump.timestamp, to));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and the data should be sorted ascending', async function () {
        const fakeData = await generateDumpsMetadataOnDb(childContainer, DEFAULT_LIMIT);
        const filter: DumpMetadataFilterQueryParams = { ...getBaseFilterQueryParams(), sort: 'asc' };

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, 'asc'));
      });

      it('should return 200 status code and empty response when there is no data on db', async function () {
        const response = await requestSender.getDumpsMetadataByFilter(app, {});

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject([]);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code for an invalid sort', async function () {
        const filter = getBaseFilterQueryParams();
        filter.sort = 'fake' as SortFilter;

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.sort should be equal to one of the allowed values: asc, desc');
      });

      it('should return 400 status code for an invalid limit lower than 1', async function () {
        const filter = { ...getBaseFilterQueryParams(), limit: 0 };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be >= 1');
      });

      it('should return 400 status code for an invalid limit greater than 100', async function () {
        const filter = { ...getBaseFilterQueryParams(), limit: 101 };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be <= 100');
      });
    });

    describe(`${SAD_PATH}`, function () {
      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));
        const mockedApp = requestSender.getMockedRepoApp(childContainer, { find: findMock });

        const response = await requestSender.getDumpsMetadataByFilter(mockedApp, {});

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });

  beforeAll(() => {
    appWithoutProjectId = requestSender.getAppWithoutProjectId(childContainer);
  });
  describe('GET /dumps/:dumpId', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dump metadata', async function () {
        const fakeDumpMetadata = (await generateDumpsMetadataOnDb(childContainer, 1))[0];

        const dumpResponse = convertFakeToResponse(fakeDumpMetadata);
        const integrationDumpMetadata = convertToISOTimestamp(dumpResponse);

        const response = await requestSender.getDumpMetadataById(app, fakeDumpMetadata.id);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(integrationDumpMetadata);
      });

      it('should return 200 status code and the dump metadata without projectId', async function () {
        const fakeDumpMetadata = (await generateDumpsMetadataOnDb(childContainer, 1))[0];

        const dumpResponse = convertFakeToResponse(fakeDumpMetadata, false);
        const integrationDumpMetadata = convertToISOTimestamp(dumpResponse);

        const response = await requestSender.getDumpMetadataById(appWithoutProjectId, fakeDumpMetadata.id);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(integrationDumpMetadata);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code and that the given id is not valid', async function () {
        const response = await requestSender.getDumpMetadataById(app, faker.random.word());

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.params.dumpId should match format "uuid"');
      });
    });

    describe(`${SAD_PATH}`, function () {
      it('should return 404 status code if a dump with the requested id does not exist', async function () {
        const response = await requestSender.getDumpMetadataById(app, faker.datatype.uuid());

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', "Couldn't find dump with the given id.");
      });

      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findOneMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));
        const mockedApp = requestSender.getMockedRepoApp(childContainer, { findOne: findOneMock });

        const response = await requestSender.getDumpMetadataById(mockedApp, faker.datatype.uuid());

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
        const response = await requestSender.createDump(app, dumpCreationBody);

        expect(response.status).toBe(httpStatusCodes.CREATED);
      });
    });

    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code if the name is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, name, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump(app, { ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'name'");
      });

      it('should return 400 status code if the bucket is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, bucket, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump(app, { ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'bucket'");
      });

      it('should return 400 status code if the timestamp is missing', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, timestamp, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump(app, { ...dumpCreationBody } as DumpMetadataCreation);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', "request.body should have required property 'timestamp'");
      });

      it('should return 400 status code if the timestamp is not in a utc format', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump(app, { ...dumpCreationBody, timestamp: faker.random.word() as unknown as Date });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.body.timestamp should match format "date-time"');
      });

      it(`should return 400 status code if the name is longer than ${NAME_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump(app, { ...dumpCreationBody, name: faker.random.alpha({ count: NAME_LENGTH_LIMIT + 1 }) });

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.name should NOT be longer than ${NAME_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the bucket is longer than ${BUCKET_NAME_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump(app, {
          ...dumpCreationBody,
          bucket: faker.random.alpha({ count: BUCKET_NAME_LENGTH_LIMIT + 1 }),
        });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.bucket should NOT be longer than ${BUCKET_NAME_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the bucket is shorter than ${BUCKET_NAME_MIN_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump(app, { ...dumpCreationBody, bucket: faker.lorem.word(BUCKET_NAME_MIN_LENGTH_LIMIT - 1) });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.bucket should NOT be shorter than ${BUCKET_NAME_MIN_LENGTH_LIMIT} characters`);
      });

      it(`should return 400 status code if the description is longer than ${DESCRIPTION_LENGTH_LIMIT} characters`, async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;

        const response = await requestSender.createDump(app, {
          ...dumpCreationBody,
          description: faker.random.alpha({ count: DESCRIPTION_LENGTH_LIMIT + 1 }),
        });
        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', `request.body.description should NOT be longer than ${DESCRIPTION_LENGTH_LIMIT} characters`);
      });

      it('should return 401 status code if no authorization header was set', async function () {
        const fakeDumpMetada = createFakeDumpMetadata();
        const { id, ...dumpCreationBody } = fakeDumpMetada;
        const response = await requestSender.createDump(app, dumpCreationBody, false);

        expect(response.status).toBe(httpStatusCodes.UNAUTHORIZED);
        expect(response.body).toHaveProperty('message', 'Authorization header required');
      });

      it('should return 422 status code if a dump with the same name already exists on the bucket', async function () {
        const fakeDump = (await generateDumpsMetadataOnDb(childContainer, 1))[0];
        const response = await requestSender.createDump(app, fakeDump);

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
        const mockedApp = requestSender.getMockedRepoApp(childContainer, { insert: insertMock, findOne: jest.fn() });

        const response = await requestSender.createDump(mockedApp, createFakeDumpMetadata());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });
});
