import { RequestHandler } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { DumpMetadataResponse } from '../models/dumpMetadata';
import { DumpMetadataManager } from '../models/dumpMetadataManager';
import { DumpNotFoundError } from '../models/errors';

interface DumpMetadataParams {
  dumpId: string;
}

type GetDumpMetadataHandler = RequestHandler<DumpMetadataParams, DumpMetadataResponse>;

@injectable()
export class DumpMetadataController {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(DumpMetadataManager) private readonly manager: DumpMetadataManager
  ) {}
  public getById: GetDumpMetadataHandler = async (req, res, next) => {
    const { dumpId } = req.params;

    let dumpMetadata: DumpMetadataResponse;
    try {
      dumpMetadata = await this.manager.getDumpMetadataById(dumpId);
    } catch (error) {
      if (error instanceof DumpNotFoundError) {
        (error as HttpError).status = httpStatus.NOT_FOUND;
      }
      return next(error);
    }

    return res.status(httpStatus.OK).json(dumpMetadata);
  };
}
