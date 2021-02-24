import * as supertest from 'supertest';
import { Application } from 'express';

import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';
import { DumpMetadataFilterQueryParams } from '../../../../src/dumpMetadata/models/dumpMetadataFilter';

export function getApp(): Application {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  return builder.build();
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

export async function getDumpMetadataById(app: Application, id: string): Promise<supertest.Response> {
  return supertest.agent(app).get(`/dumps/${id}`).set('Content-Type', 'application/json').accept('application/json');
}
