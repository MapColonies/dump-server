import * as supertest from 'supertest';
import { DumpMetadataFilterQueryParams } from '../../../../src/dumpMetadata/models/dumpMetadataFilter';
import { DumpMetadataCreation } from '../../../../src/dumpMetadata/models/dumpMetadata';

export class DumpMetadataRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getDumpsMetadataByFilter(filter: DumpMetadataFilterQueryParams | Record<string, never>): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/dumps`).query(filter).set('Content-Type', 'application/json').accept('application/json');
  }

  public async createDump(dump: DumpMetadataCreation): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/dumps`).set('Content-Type', 'application/json').send(dump);
  }

  public async getDumpMetadataById(id: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/dumps/${id}`).set('Content-Type', 'application/json').accept('application/json');
  }
}
