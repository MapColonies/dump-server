import * as supertest from 'supertest';
import { Application } from 'express';

import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';

export function getApp(): Application {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  return builder.build();
}

export function getMockedRepoApp(repo: unknown): Application {
  container.register('DumpMetadataRepository', { useValue: repo });
  return getApp();
}

export async function getDumpMetadataById(app: Application, id: string, responseType = 'application/json'): Promise<supertest.Response> {
  return supertest.agent(app).get(`/dumps/${id}`).set('Content-Type', 'application/json').accept(responseType);
}
