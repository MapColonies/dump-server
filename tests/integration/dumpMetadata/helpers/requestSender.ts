import supertest, { type Response } from 'supertest';
import type { App } from 'supertest/types';
import type { DumpMetadataFilterQueryParams } from '@src/dumpMetadata/models/dumpMetadataFilter';
import type { DumpMetadataCreation } from '@src/dumpMetadata/models/dumpMetadata';

export class DumpMetadataRequestSender {
  public constructor(private readonly app: App) {}

  public async getDumpsMetadataByFilter(filter: DumpMetadataFilterQueryParams | Record<string, never>): Promise<Response> {
    return supertest.agent(this.app).get(`/dumps`).query(filter).set('Content-Type', 'application/json').accept('application/json');
  }

  public async createDump(dump: DumpMetadataCreation): Promise<Response> {
    return supertest.agent(this.app).post(`/dumps`).set('Content-Type', 'application/json').send(dump);
  }

  public async getDumpMetadataById(id: string): Promise<Response> {
    return supertest.agent(this.app).get(`/dumps/${id}`).set('Content-Type', 'application/json').accept('application/json');
  }
}
