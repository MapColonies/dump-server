import { RequestHandler } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { DumpMetadataResponse } from '../models/dumpMetadata';
import { DumpMetadataFilter } from '../models/dumpMetadataFilter';
import { DumpMetadataManager } from '../models/dumpMetadataManager';
import { DumpNotFoundError } from '../models/errors';

interface DumpMetadataParams {
  dumpId: string;
}

type GetDumpMetadataByIdHandler = RequestHandler<DumpMetadataParams, DumpMetadataResponse>;

type GetDumpsMetadataHandler = RequestHandler<undefined, DumpMetadataResponse[], undefined, DumpMetadataFilter>;

@injectable()
export class DumpMetadataController {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(DumpMetadataManager) private readonly manager: DumpMetadataManager
  ) {}
  public getById: GetDumpMetadataByIdHandler = async (req, res, next) => {
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

  public getByFilter: GetDumpsMetadataHandler = async (req, res, next) => {
    let dumpsMetadata: DumpMetadataResponse[];
    try {
      dumpsMetadata = await this.manager.getDumpsMetadataByFilter(req.query);
    } catch (error) {
      return next(error);
    }

    return res.status(httpStatus.OK).json(dumpsMetadata);
  };
}
