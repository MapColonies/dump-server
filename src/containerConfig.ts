import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { jsLogger } from '@map-colonies/js-logger';
import type { HealthCheck } from '@godaddy/terminus';
import { instancePerContainerCachingFactory } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import type { Repository } from 'typeorm';
import { Connection } from 'typeorm';
import { type InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { connectionFactory, getDbHealthCheckFunction } from '@common/db';
import { dumpMetadataRouterFactory, DUMP_METADATA_ROUTER_SYMBOL } from './dumpMetadata/routes/dumpMetadataRouter';
import { DumpMetadata, DUMP_METADATA_REPOSITORY_SYMBOL } from './dumpMetadata/DAL/typeorm/dumpMetadata';
import { getConfig } from './common/config';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');

  const logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const objectStorageConfig = configInstance.get('objectStorage');

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: SERVICES.OBJECT_STORAGE, provider: { useValue: objectStorageConfig } },
    {
      token: Connection,
      provider: { useFactory: instancePerContainerCachingFactory(connectionFactory) },
      postInjectionHook: async (container: DependencyContainer): Promise<void> => {
        const connection = container.resolve<Connection>(Connection);
        await connection.connect();
      },
    },
    {
      token: DUMP_METADATA_REPOSITORY_SYMBOL,
      provider: {
        useFactory: (container): Repository<DumpMetadata> => {
          const connection = container.resolve<Connection>(Connection);
          return connection.getRepository(DumpMetadata);
        },
      },
    },
    { token: DUMP_METADATA_ROUTER_SYMBOL, provider: { useFactory: dumpMetadataRouterFactory } },
    {
      token: SERVICES.HEALTHCHECK,
      provider: { useFactory: (container): HealthCheck => getDbHealthCheckFunction(container.resolve<Connection>(Connection)) },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await Promise.all([getTracing().stop()]);
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
