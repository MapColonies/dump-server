import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { get } from 'config';

import { Services } from '../../common/constants';
import { ILogger, IStorageConfig } from '../../common/interfaces';
import { DumpMetadata, DumpMetadataResponse, IDumpMetadata } from './dumpMetadata';
import { DumpNotFoundError } from './errors';

const getUrlHeader = (): string => {
  const storageConfig = get<IStorageConfig>('storage');
  return `${storageConfig.protocol}://${storageConfig.host}`;
};

export const parseDumpMetadataToDumpMetadataResponse = (dumpMetadata: IDumpMetadata): DumpMetadataResponse => {
  const { bucket, ...rest } = dumpMetadata;
  const url = `${getUrlHeader()}/${bucket}/${rest.name}`;
  const response: DumpMetadataResponse = { ...rest, url };
  return response;
};

@injectable()
export class DumpMetadataManager {
  public constructor(
    @inject('DumpMetadataRepository') private readonly repository: Repository<DumpMetadata>,
    @inject(Services.LOGGER) private readonly logger: ILogger
  ) {}

  public async getDumpMetadataById(id: string): Promise<DumpMetadataResponse> {
    const dumpMetadata = await this.repository.findOne(id);
    if (!dumpMetadata) {
      throw new DumpNotFoundError("Couldn't find dump with the given id.");
    }
    const dumpMetadataResponse = parseDumpMetadataToDumpMetadataResponse(dumpMetadata);
    return dumpMetadataResponse;
  }
}
