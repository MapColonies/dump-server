import { inject, injectable } from 'tsyringe';
import { FindManyOptions, Repository } from 'typeorm';
import { Logger } from '@map-colonies/js-logger';
import { Services } from '../../common/constants';
import { IObjectStorageConfig } from '../../common/interfaces';
import { isStringUndefinedOrEmpty } from '../../common/utils';
import { DumpNameAlreadyExistsError } from '../../common/errors';
import { DumpMetadata } from '../DAL/typeorm/dumpMetadata';
import { DumpMetadataCreation, DumpMetadataResponse } from './dumpMetadata';
import { DumpNotFoundError } from './errors';
import { buildFilterQuery, DumpMetadataFilter } from './dumpMetadataFilter';

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
    const { name, bucket } = newDumpMetadata;
    this.logger.info({ msg: 'creating new dump metadata', dumpName: name, bucket });

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
    const { projectId } = this.objectStorageConfig;
    let bucketCombined: string = bucket;
    if (!isStringUndefinedOrEmpty(projectId)) {
      bucketCombined = `${projectId}:${bucket}`;
    }
    const url = `${this.urlHeader}/${bucketCombined}/${restOfMetadata.name}`;
    return { ...restOfMetadata, url };
  }
}
