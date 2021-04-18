import { StatusCodes } from 'http-status-codes';

export class NotFoundError extends Error {
  public status = StatusCodes.NOT_FOUND;
}

export class DumpNameAlreadyExistsError extends Error {
  public status = StatusCodes.UNPROCESSABLE_ENTITY;
}
