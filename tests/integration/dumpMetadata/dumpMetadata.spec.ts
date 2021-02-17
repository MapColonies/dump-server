import { Application } from 'express';
import { container } from 'tsyringe';
import { QueryFailedError, Repository } from 'typeorm';
import faker from 'faker';
import httpStatusCodes from 'http-status-codes';
import { isWithinInterval, isAfter, isBefore } from 'date-fns';

import { DumpMetadata } from '../../../src/dumpMetadata/models/dumpMetadata';
import { registerTestValues } from '../testContainerConfig';
import { HAPPY_PATH, SAD_PATH, BAD_PATH } from '../constants';
import {
  createFakeString,
  createFakeUUID,
  getDefaultFilter,
  sortByOrderFilter,
  DEFAULT_LIMIT,
  DEFAULT_SORT,
  TOP_TO,
  BOTTOM_FROM,
  createFakeDate,
  convertFakesToResponses,
  convertFakeToResponse,
  convertToISOTimestamp,
} from '../../helpers';
import { DumpMetadataFilter } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { SortFilter } from '../../../src/dumpMetadata/models/dumpMetadataFilter';
import { generateDumpsMetadataOnDb } from './helpers/db';
import * as requestSender from './helpers/requestSender';
import { getRepositoryFromContainer } from './helpers/db';

let app: Application;
let repository: Repository<DumpMetadata>;

describe('dumps', function () {
  beforeAll(async function () {
    await registerTestValues();
    app = requestSender.getApp();
    repository = getRepositoryFromContainer(DumpMetadata);
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
        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT);

        const fakeResponses = convertFakesToResponses(fakeData);

        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, {});

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, DEFAULT_SORT));
      });

      it('should return 200 status code and the dumps queried by filter', async function () {
        const from = createFakeDate();
        const to = faker.date.between(from, TOP_TO);
        const filter: DumpMetadataFilter = { limit: DEFAULT_LIMIT, sort: 'asc', from, to };

        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT + 1);

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
        const fakeData = await generateDumpsMetadataOnDb(amountOfDumpsToCreate);

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, getDefaultFilter());

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(amountOfDumpsToCreate);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, DEFAULT_SORT));
      });

      it('should return 200 status code and only the top requested limit by the requested sort', async function () {
        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT + 1);
        const filter = getDefaultFilter();

        const fakeResponses = convertFakesToResponses(fakeData);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toHaveLength(DEFAULT_LIMIT);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort).slice(0, DEFAULT_LIMIT));
      });

      it('should return 200 status code and empty response when requesting filter with a later from than to', async function () {
        await generateDumpsMetadataOnDb(1);
        const filter: DumpMetadataFilter = { ...getDefaultFilter(), from: TOP_TO, to: BOTTOM_FROM };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject([]);
      });

      it('should return 200 status code and response with only dumps correlating to the from filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT);

        const from = createFakeDate();
        const filter: DumpMetadataFilter = { ...getDefaultFilter(), from };

        const dataFilteredByTime = fakeData.filter((dump) => isAfter(dump.timestamp, from));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and response with only dumps correlating to the to filter', async function () {
        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT);
        const to = createFakeDate();
        const filter: DumpMetadataFilter = { ...getDefaultFilter(), to };

        const dataFilteredByTime = fakeData.filter((dump) => isBefore(dump.timestamp, to));
        const fakeResponses = convertFakesToResponses(dataFilteredByTime);
        const integrationDumpsMetadata = fakeResponses.map((response) => convertToISOTimestamp(response));

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(sortByOrderFilter(integrationDumpsMetadata, filter.sort));
      });

      it('should return 200 status code and the data should be sorted ascending', async function () {
        const fakeData = await generateDumpsMetadataOnDb(DEFAULT_LIMIT);
        const filter: DumpMetadataFilter = { ...getDefaultFilter(), sort: 'asc' };

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
        const filter = getDefaultFilter();
        filter.sort = 'fake' as SortFilter;

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.sort should be equal to one of the allowed values: asc, desc');
      });

      it('should return 400 status code for an invalid limit lower than 1', async function () {
        const filter = { ...getDefaultFilter(), limit: 0 };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be >= 1');
      });

      it('should return 400 status code for an invalid limit greater than 100', async function () {
        const filter = { ...getDefaultFilter(), limit: 101 };

        const response = await requestSender.getDumpsMetadataByFilter(app, filter);

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.query.limit should be <= 100');
      });
    });
    describe(`${SAD_PATH}`, function () {
      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));
        const mockedApp = requestSender.getMockedRepoApp({ find: findMock });

        const response = await requestSender.getDumpsMetadataByFilter(mockedApp, {});

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });
  describe('GET /dumps/:dumpId', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dump metadata', async function () {
        const fakeDumpMetadata = (await generateDumpsMetadataOnDb(1))[0];

        const dumpResponse = convertFakeToResponse(fakeDumpMetadata);
        const integrationDumpMetadata = convertToISOTimestamp(dumpResponse);

        const response = await requestSender.getDumpMetadataById(app, fakeDumpMetadata.id);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(integrationDumpMetadata);
      });
    });
    describe(`${BAD_PATH}`, function () {
      it('should return 400 status code and that the given id is not valid', async function () {
        const response = await requestSender.getDumpMetadataById(app, createFakeString());

        expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
        expect(response.body).toHaveProperty('message', 'request.params.dumpId should match format "uuid"');
      });
    });
    describe(`${SAD_PATH}`, function () {
      it('should return 404 status code if a dump with the requested id does not exist', async function () {
        const response = await requestSender.getDumpMetadataById(app, createFakeUUID());

        expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
        expect(response.body).toHaveProperty('message', "Couldn't find dump with the given id.");
      });

      it('should return 500 status code if a database exception occurs', async function () {
        const errorMessage = 'An error occurred';
        const findOneMock = jest.fn().mockRejectedValue(new QueryFailedError('', undefined, new Error(errorMessage)));
        const mockedApp = requestSender.getMockedRepoApp({ findOne: findOneMock });

        const response = await requestSender.getDumpMetadataById(mockedApp, createFakeUUID());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });
});
