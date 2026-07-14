import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 8080;
export const DB_HEALTHCHECK_TIMEOUT_MS = 5000;

export const ON_SIGNAL = Symbol('onSignal');
export const HEALTHCHECK = Symbol('healthcheck');

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/, /^.*\/metrics.*/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('METRICS'),
  CLEANUP_REGISTRY: Symbol('CleanupRegistry'),
  OBJECT_STORAGE: Symbol('ObjectStorage'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */

export const NAME_LENGTH_LIMIT = 100;
export const BUCKET_NAME_LENGTH_LIMIT = 63;
export const BUCKET_NAME_MIN_LENGTH_LIMIT = 3;
export const DESCRIPTION_LENGTH_LIMIT = 256;
