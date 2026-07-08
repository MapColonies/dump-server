/* eslint-disable */
// This file was auto-generated. Do not edit manually.
// To update, run the error generation script again.

import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/dumps': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get dumps by optional filters */
    get: operations['getDumps'];
    put?: never;
    /** Create a dump */
    post: operations['postDump'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/dumps/{dumpId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get a dump by id */
    get: operations['getDumpById'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    /** Format: date-time */
    dumpDate: string;
    /** Format: uuid */
    dumpId: string;
    error: {
      message: string;
    };
    baseDump: {
      name: string;
      timestamp: components['schemas']['dumpDate'];
      description?: string;
      /** Format: int64 */
      sequenceNumber?: number;
    };
    dumpResponse: components['schemas']['baseDump'] &
      Record<string, never> &
      unknown & {
        id?: components['schemas']['dumpId'];
        url?: string;
      };
    dumpCreation: components['schemas']['baseDump'] &
      Record<string, never> &
      unknown & {
        bucket?: string;
      };
  };
  responses: {
    /** @description Bad Request */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Not Found */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Unauthorized Error */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Unexpected Error */
    UnexpectedError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
    /** @description Unprocessable Entity */
    UnprocessableEntity: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['error'];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  getDumps: {
    parameters: {
      query?: {
        /** @description The number of dumps to be returned in a request */
        limit?: number;
        /** @description The date to fetch dumps from */
        from?: components['schemas']['dumpDate'];
        /** @description The date to fetch dumps until */
        to?: components['schemas']['dumpDate'];
        /** @description Date sort order */
        sort?: 'asc' | 'desc';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['dumpResponse'][];
        };
      };
      400: components['responses']['BadRequest'];
      '5XX': components['responses']['UnexpectedError'];
    };
  };
  postDump: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': components['schemas']['dumpCreation'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      '5XX': components['responses']['UnexpectedError'];
    };
  };
  getDumpById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description id of the dump to get */
        dumpId: components['schemas']['dumpId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['dumpResponse'];
        };
      };
      400: components['responses']['BadRequest'];
      404: components['responses']['NotFound'];
      422: components['responses']['UnprocessableEntity'];
      '5XX': components['responses']['UnexpectedError'];
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
