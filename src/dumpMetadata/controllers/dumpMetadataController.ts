import { RequestHandler } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { parseISO } from 'date-fns';

import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { DumpMetadataCreation, DumpMetadataResponse } from '../models/dumpMetadata';
import { DumpMetadataFilter, DumpMetadataFilterQueryParams } from '../models/dumpMetadataFilter';
import { DumpMetadataManager } from '../models/dumpMetadataManager';
import { DumpNotFoundError } from '../models/errors';

interface DumpMetadataParams {
  dumpId: string;
}

type GetDumpMetadataByIdHandler = RequestHandler<DumpMetadataParams, DumpMetadataResponse>;

type GetDumpsMetadataHandler = RequestHandler<undefined, DumpMetadataResponse[], undefined, DumpMetadataFilterQueryParams>;

type PostDumpMetadataHandler = RequestHandler<undefined, undefined, DumpMetadataCreation>;

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
      const { from, to } = req.query;
      const query: DumpMetadataFilter = {
        ...req.query,
        to: to !== undefined ? parseISO(to) : undefined,
        from: from !== undefined ? parseISO(from) : undefined,
      };
      dumpsMetadata = await this.manager.getDumpsMetadataByFilter(query);
    } catch (error) {
      return next(error);
    }

    return res.status(httpStatus.OK).json(dumpsMetadata);
  };

  public post: PostDumpMetadataHandler = async (req, res, next) => {
    try {
      await this.manager.createDumpMetadata(req.body);
    } catch (error) {
      return next(error);
    }
    return res.sendStatus(httpStatus.CREATED);
  };
}
