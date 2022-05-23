import { container } from 'tsyringe';
import { Connection } from 'typeorm';
import config from 'config';
import { trace } from '@opentelemetry/api';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { HealthCheck } from '@godaddy/terminus';

import { dumpMetadataRouterFactory } from './dumpMetadata/routes/dumpMetadataRouter';
import { tracing } from './common/tracing';
import { DB_HEALTHCHECK_TIMEOUT_MS, Services } from './common/constants';
import { promiseTimeout } from './common/utils/promiseTimeout';
import { DumpMetadata } from './dumpMetadata/DAL/typeorm/dumpMetadata';
import { DbConfig, IObjectStorageConfig } from './common/interfaces';
import { initConnection } from './common/db/connection';

const healthCheck = (connection: Connection): HealthCheck => {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(DB_HEALTHCHECK_TIMEOUT_MS, check);
  };
};

const beforeShutdown = (connection: Connection): (() => Promise<void>) => {
  return async (): Promise<void> => {
    await connection.close();
  };
};

async function registerExternalValues(): Promise<void> {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, hooks: { logMethod } });

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register('dumpsRouter', { useFactory: dumpMetadataRouterFactory });

  const objectStorageConfig = config.get<IObjectStorageConfig>('objectStorage');
  container.register(Services.OBJECT_STORAGE, { useValue: objectStorageConfig });

  const connectionOptions = config.get<DbConfig>('db');
  const connection = await initConnection(connectionOptions);
  container.register(Connection, { useValue: connection });
  container.register('DumpMetadataRepository', { useValue: connection.getRepository(DumpMetadata) });

  const tracer = trace.getTracer('dump-server');
  tracing.start();
  container.register(Services.TRACER, { useValue: tracer });

  container.register(Services.HEALTHCHECK, { useValue: healthCheck(connection) });

  const metrics = new Metrics('dump-server');
  const meter = metrics.start();
  container.register(Services.METER, { useValue: meter });
  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.all([tracing.stop(), metrics.stop(), beforeShutdown(connection)]);
    },
  });
}

export { registerExternalValues };
