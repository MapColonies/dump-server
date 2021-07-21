import { inject, injectable } from 'tsyringe';
import { FindManyOptions, Repository, FindOperator, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Logger } from '@map-colonies/js-logger';

import { Services } from '../../common/constants';
import { IObjectStorageConfig } from '../../common/interfaces';
import { isStringUndefinedOrEmpty } from '../../common/utils';
import { DumpNameAlreadyExistsError } from '../../common/errors';
import { DumpMetadata, DumpMetadataCreation, DumpMetadataResponse, IDumpMetadata } from './dumpMetadata';
import { DumpNotFoundError } from './errors';
import { DumpMetadataFilter } from './dumpMetadataFilter';

@injectable()
export class DumpMetadataManager {
  private readonly urlHeader: string;

  public constructor(
    @inject('DumpMetadataRepository') private readonly repository: Repository<DumpMetadata>,
    @inject(Services.LOGGER) private readonly logger: Logger,
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
    const dumpExists = await this.repository.findOne({ where: [{ bucket: newDumpMetadata.bucket, name: newDumpMetadata.name }] });
    if (dumpExists) {
      throw new DumpNameAlreadyExistsError(
        `dump metadata on bucket: ${newDumpMetadata.bucket} with the name: ${newDumpMetadata.name} already exists.`
      );
    }
    const insertionResult = await this.repository.insert(newDumpMetadata);
    return insertionResult.identifiers[0].id as string;
  }

  private getUrlHeader(): string {
    const { protocol, host, port } = this.objectStorageConfig;
    return `${protocol}://${host}:${port}`;
  }

  private convertDumpMetadataToDumpMetadataResponse(dumpMetadata: IDumpMetadata): DumpMetadataResponse {
    const { bucket, ...restOfMetadata } = dumpMetadata;
    const { projectId } = this.objectStorageConfig;
    let bucketCombined: string = bucket;
    if (!isStringUndefinedOrEmpty(projectId)) {
      bucketCombined = `${projectId}:${bucket}`;
    }
    const url = `${this.urlHeader}/${bucketCombined}/${restOfMetadata.name}`;
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
