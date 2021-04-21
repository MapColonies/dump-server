import { inject, injectable } from 'tsyringe';
import { FindManyOptions, Repository, FindOperator, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

import { Services } from '../../common/constants';
import { ILogger, IObjectStorageConfig } from '../../common/interfaces';
import { DumpMetadata, DumpMetadataCreation, DumpMetadataResponse, IDumpMetadata } from './dumpMetadata';
import { DumpNotFoundError } from './errors';
import { DumpMetadataFilter } from './dumpMetadataFilter';

@injectable()
export class DumpMetadataManager {
  private readonly urlHeader: string;

  public constructor(
    @inject('DumpMetadataRepository') private readonly repository: Repository<DumpMetadata>,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.OBJECT_STORAGE) private readonly objectStorageConfig: IObjectStorageConfig
  ) {
    this.urlHeader = this.getUrlHeader();
  }

  public async getDumpMetadataById(id: string): Promise<DumpMetadataResponse> {
    const dumpMetadata = await this.repository.findOne(id);
    if (!dumpMetadata) {
      throw new DumpNotFoundError("Couldn't find dump with the given id.");
    }
    const dumpMetadataResponse = this.convertDumpMetadataToDumpMetadataResponse(dumpMetadata);
    return dumpMetadataResponse;
  }

  public async getDumpsMetadataByFilter(filter: DumpMetadataFilter): Promise<DumpMetadataResponse[]> {
    const query: FindManyOptions<DumpMetadata> = this.buildQuery(filter);
    const dumpsMetadata = await this.repository.find(query);
    return dumpsMetadata.map((dumpMetadata) => this.convertDumpMetadataToDumpMetadataResponse(dumpMetadata));
  }

  public async createDumpMetadata(newDumpMetadata: DumpMetadataCreation): Promise<string> {
    const insertionResult = await this.repository.insert(newDumpMetadata);
    return insertionResult.identifiers[0].id as string;
  }

  private getUrlHeader(): string {
    const { protocol, host, projectId, port } = this.objectStorageConfig;
    if (projectId != undefined && projectId.length > 0) {
      return `${protocol}://${host}/${projectId}:${port}`;
    }
    return `${protocol}://${host}:${port}`;
  }

  private convertDumpMetadataToDumpMetadataResponse(dumpMetadata: IDumpMetadata): DumpMetadataResponse {
    const { bucket, ...restOfMetadata } = dumpMetadata;
    const url = `${this.urlHeader}/${bucket}/${restOfMetadata.name}`;
    return { ...restOfMetadata, url };
  }

  private buildQuery(filter: DumpMetadataFilter): FindManyOptions<DumpMetadata> {
    const findManyOptions: FindManyOptions<DumpMetadata> = {};
    // limit
    findManyOptions.take = filter.limit;

    // sort
    const order = filter.sort === 'asc' ? 'ASC' : 'DESC';
    findManyOptions.order = { timestamp: order };

    // to & from
    const timesFilter = this.buildTimestampRangeFilter(filter.from, filter.to);
    if (timesFilter) {
      findManyOptions.where = { timestamp: timesFilter };
    }
    return findManyOptions;
  }

  private buildTimestampRangeFilter(from?: Date, to?: Date): FindOperator<Date> | undefined {
    if (from && to) {
      return Between(from, to);
    } else if (from && !to) {
      return MoreThanOrEqual(from);
    } else if (!from && to) {
      return LessThanOrEqual(to);
    }
    return undefined;
  }
}
