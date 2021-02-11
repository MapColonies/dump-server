import { Application } from 'express';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { QueryFailedError } from 'typeorm';

import { DumpMetadataResponse } from '../../../src/dumpMetadata/models/dumpMetadata';
import { registerTestValues } from '../testContainerConfig';
import { HAPPY_PATH, SAD_PATH, BAD_PATH } from '../constants';
import { createFakeString, createFakeUUID } from '../../common/helpers/helpers';
import { parseDumpMetadataToDumpMetadataResponse } from '../../../src/dumpMetadata/models/dumpMetadataManager';
import { createDbDumpMetadata } from './helpers/db';
import * as requestSender from './helpers/requestSender';

let app: Application;

interface IntegrationDumpMetadata extends Omit<DumpMetadataResponse, 'timestamp'> {
  timestamp: string;
}

describe('dumps', function () {
  beforeAll(async function () {
    await registerTestValues();
    app = requestSender.getApp();
  });
  afterAll(function () {
    container.reset();
  });
  describe('GET /dumps/:dumpId', function () {
    describe(`${HAPPY_PATH}`, function () {
      it('should return 200 status code and the dump metadata', async function () {
        const dumpMetadata = await createDbDumpMetadata();
        const response = await requestSender.getDumpMetadataById(app, dumpMetadata.id);

        const dumpMetadataResponse: DumpMetadataResponse = parseDumpMetadataToDumpMetadataResponse(dumpMetadata);
        const { timestamp, ...rest } = dumpMetadataResponse;
        const integrationDumpMetadata: IntegrationDumpMetadata = { ...rest, timestamp: timestamp.toJSON() };

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
        const findOneMock = jest.fn().mockRejectedValue(new QueryFailedError('', [], new Error(errorMessage)));
        const mockedApp = requestSender.getMockedRepoApp({ findOne: findOneMock });
        const response = await requestSender.getDumpMetadataById(mockedApp, createFakeUUID());

        expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
        expect(response.body).toHaveProperty('message', errorMessage);
      });
    });
  });
});
