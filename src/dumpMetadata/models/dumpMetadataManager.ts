import { inject, injectable } from 'tsyringe';
import { FindManyOptions, Repository, FindOperator } from 'typeorm';

import { Services } from '../../common/constants';
import { ILogger, IObjectStorageConfig } from '../../common/interfaces';
import { moreThanOrEqualTimestamp, DateTypeFormat, lessThanOrEqualTimestamp, betweenTimestamps } from '../../common/utils/db';
import { DumpMetadata, DumpMetadataResponse, IDumpMetadata } from './dumpMetadata';
import { DumpNotFoundError } from './errors';
import { DumpMetadataFilter } from './dumpMetadataFilter';

@injectable()
export class DumpMetadataManager {
  public constructor(
    @inject('DumpMetadataRepository') private readonly repository: Repository<DumpMetadata>,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.OBJECT_STORAGE) private readonly objectStorageConfig: IObjectStorageConfig
  ) {}

  public async getDumpMetadataById(id: string): Promise<DumpMetadataResponse> {
    const dumpMetadata = await this.repository.findOne(id);
    if (!dumpMetadata) {
      throw new DumpNotFoundError("Couldn't find dump with the given id.");
    }
    const dumpMetadataResponse = this.parseDumpMetadataToDumpMetadataResponse(dumpMetadata);
    return dumpMetadataResponse;
  }

  public async getDumpsMetadataByFilter(filter: DumpMetadataFilter): Promise<DumpMetadataResponse[]> {
    const query: FindManyOptions<DumpMetadata> = this.buildQuery(filter);
    const dumpsMetadata = await this.repository.find(query);
    return dumpsMetadata.map((dumpMetadata) => this.parseDumpMetadataToDumpMetadataResponse(dumpMetadata));
  }

  private getUrlHeader(): string {
    const { protocol, host } = this.objectStorageConfig;
    return `${protocol}://${host}`;
  }

  private parseDumpMetadataToDumpMetadataResponse(dumpMetadata: IDumpMetadata): DumpMetadataResponse {
    const { bucket, ...restOfMetadata } = dumpMetadata;
    const url = `${this.getUrlHeader()}/${bucket}/${restOfMetadata.name}`;
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

  private buildTimestampRangeFilter(from?: Date, to?: Date): FindOperator<string> | undefined {
    const format = DateTypeFormat.DATETIME;
    if (from && to) {
      return betweenTimestamps(new Date(from), new Date(to), format);
    } else if (from && !to) {
      return moreThanOrEqualTimestamp(new Date(from), format);
    } else if (!from && to) {
      return lessThanOrEqualTimestamp(new Date(to), format);
    }
    return undefined;
  }
}
