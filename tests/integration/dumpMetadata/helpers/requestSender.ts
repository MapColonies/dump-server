import * as supertest from 'supertest';
import { Application } from 'express';
import { container } from 'tsyringe';
import { get } from 'config';

import { ServerBuilder } from '../../../../src/serverBuilder';
import { DumpMetadataFilterQueryParams } from '../../../../src/dumpMetadata/models/dumpMetadataFilter';
import { DumpMetadataCreation } from '../../../../src/dumpMetadata/models/dumpMetadata';
import { IApplicationConfig } from '../../../../src/common/interfaces';
import { Services } from '../../../../src/common/constants';
import { getMockObjectStorageConfig } from '../../../helpers';

const SECRET_TOKEN = get<IApplicationConfig>('application').authToken;

const setAuth = async (testRequest: supertest.Test): Promise<supertest.Test> => {
  return testRequest.set('Authorization', `Bearer ${SECRET_TOKEN}`);
};

export function getApp(): Application {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  return builder.build();
}

export function getAppWithoutProjectId(): Application {
  container.register(Services.OBJECT_STORAGE, { useValue: getMockObjectStorageConfig(false) });
  return getApp();
}

export function getMockedRepoApp(repo: unknown): Application {
  container.register('DumpMetadataRepository', { useValue: repo });
  return getApp();
}

export async function getDumpsMetadataByFilter(
  app: Application,
  filter: DumpMetadataFilterQueryParams | Record<string, never>
): Promise<supertest.Response> {
  return supertest.agent(app).get(`/dumps`).query(filter).set('Content-Type', 'application/json').accept('application/json');
}

export async function createDump(app: Application, dump: DumpMetadataCreation, shouldAuth = true): Promise<supertest.Response> {
  const testRequest = supertest.agent(app).post(`/dumps`).set('Content-Type', 'application/json').send(dump);
  return shouldAuth ? setAuth(testRequest) : testRequest;
}

export async function getDumpMetadataById(app: Application, id: string): Promise<supertest.Response> {
  return supertest.agent(app).get(`/dumps/${id}`).set('Content-Type', 'application/json').accept('application/json');
}
