import { inject, injectable } from 'tsyringe';
import { FindManyOptions, Repository } from 'typeorm';
import { Logger } from '@map-colonies/js-logger';
import { omitBy, isNil } from 'lodash';
import { Services } from '../../common/constants';
import { IObjectStorageConfig } from '../../common/interfaces';
import { isStringUndefinedOrEmpty } from '../../common/utils';
import { DumpNameAlreadyExistsError } from '../../common/errors';
import { DumpMetadata, DUMP_METADATA_REPOSITORY_SYMBOL } from '../DAL/typeorm/dumpMetadata';
import { DumpMetadataCreation, DumpMetadataResponse } from './dumpMetadata';
import { DumpNotFoundError } from './errors';
import { buildFilterQuery, DumpMetadataFilter } from './dumpMetadataFilter';

@injectable()
export class DumpMetadataManager {
  private readonly urlHeader: string;
  private readonly projectId?: string;

  public constructor(
    @inject(DUMP_METADATA_REPOSITORY_SYMBOL) private readonly repository: Repository<DumpMetadata>,
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(Services.OBJECT_STORAGE) private readonly objectStorageConfig: IObjectStorageConfig
  ) {
    this.urlHeader = this.getUrlHeader();
    if (!isStringUndefinedOrEmpty(this.objectStorageConfig.projectId)) {
      this.projectId = this.objectStorageConfig.projectId;
    }
  }

  public async getDumpMetadataById(id: string): Promise<DumpMetadataResponse> {
    this.logger.info({ msg: 'getting dump metadata by id', id });

    const dumpMetadata = await this.repository.findOne(id);
    if (!dumpMetadata) {
      this.logger.error({ msg: 'could not find dump metadata by id', id });
      throw new DumpNotFoundError("Couldn't find dump with the given id.");
    }
    const dumpMetadataResponse = this.convertDumpMetadataToDumpMetadataResponse(dumpMetadata);
    return dumpMetadataResponse;
  }

  public async getDumpsMetadataByFilter(filter: DumpMetadataFilter): Promise<DumpMetadataResponse[]> {
    this.logger.info({ msg: 'getting dumps metadata by filter', filter });

    const query: FindManyOptions<DumpMetadata> = buildFilterQuery(filter);
    const dumpsMetadata = await this.repository.find(query);

    this.logger.debug({ msg: 'fetched dumps metadata matching filter', filter, count: dumpsMetadata.length });

    return dumpsMetadata.map((dumpMetadata) => this.convertDumpMetadataToDumpMetadataResponse(dumpMetadata));
  }

  public async createDumpMetadata(newDumpMetadata: DumpMetadataCreation): Promise<string> {
    const { name, bucket, sequenceNumber } = newDumpMetadata;
    this.logger.info({ msg: 'creating new dump metadata', dumpName: name, bucket, sequenceNumber });

    const dumpExists = await this.repository.findOne({ where: [{ bucket, name }] });
    if (dumpExists) {
      this.logger.error({ msg: 'dump metadata with the same properties already exists', dumpName: name, bucket });
      throw new DumpNameAlreadyExistsError(`dump metadata on bucket: ${bucket} with the name: ${name} already exists.`);
    }

    const insertionResult = await this.repository.insert(newDumpMetadata);
    const newlyCreatedDumpMetadataId = insertionResult.identifiers[0].id as string;

    this.logger.info({ msg: 'created dump metadata', id: newlyCreatedDumpMetadataId, dumpName: name, bucket });

    return newlyCreatedDumpMetadataId;
  }

  private getUrlHeader(): string {
    const { protocol, host, port } = this.objectStorageConfig;
    return `${protocol}://${host}:${port}`;
  }

  private convertDumpMetadataToDumpMetadataResponse(dumpMetadata: DumpMetadata): DumpMetadataResponse {
    const { bucket, ...restOfMetadata } = dumpMetadata;

    let fullBucketName: string = bucket;
    if (this.projectId !== undefined) {
      fullBucketName = `${this.projectId}:${bucket}`;
    }
    const url = `${this.urlHeader}/${fullBucketName}/${restOfMetadata.name}`;

    const nonNilMetadata = omitBy(restOfMetadata, isNil) as unknown as DumpMetadataResponse;
    return { ...nonNilMetadata, url };
  }
}
