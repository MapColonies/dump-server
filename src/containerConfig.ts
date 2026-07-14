import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { jsLogger, type Logger } from '@map-colonies/js-logger';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { instancePerContainerCachingFactory } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe/dist/typings/types';
import type { Connection } from 'typeorm';
import { type InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { HEALTHCHECK, ON_SIGNAL, SERVICES, SERVICE_NAME } from '@common/constants';
import type { IObjectStorageConfig } from '@common/interfaces';
import { getTracing } from '@common/tracing';
import { connectionFactory, DB_CONNECTION_PROVIDER, healthCheckFactory } from '@common/db';
import { dumpMetadataRouterFactory, DUMP_METADATA_ROUTER_SYMBOL } from './dumpMetadata/routes/dumpMetadataRouter';
import { dumpMetadataRepositoryFactory, DUMP_METADATA_REPOSITORY_SYMBOL } from './dumpMetadata/DAL/typeorm/dumpMetadataRepository';
import { type ConfigType, getConfig } from './common/config';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const cleanupRegistry = new CleanupRegistry();

  try {
    const configInstance = getConfig();
    const loggerConfig = configInstance.get('telemetry.logger');
    const logger = await jsLogger({ ...loggerConfig, mixin: getOtelMixin() });

    const dependencies: InjectionObject<unknown>[] = [
      { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
      { token: SERVICES.LOGGER, provider: { useValue: logger } },
      {
        token: SERVICES.CLEANUP_REGISTRY,
        provider: { useValue: cleanupRegistry },
        postInjectionHook(container): void {
          const logger = container.resolve<Logger>(SERVICES.LOGGER);
          const cleanupRegistryLogger = logger.child({ subComponent: 'cleanupRegistry' });

          cleanupRegistry.on('itemFailed', (id, error, msg) => cleanupRegistryLogger.error({ msg, itemId: id, err: error }));
          cleanupRegistry.on('itemCompleted', (id) => cleanupRegistryLogger.info({ itemId: id, msg: 'cleanup finished for item' }));
          cleanupRegistry.on('finished', (status) => cleanupRegistryLogger.info({ msg: `cleanup registry finished cleanup`, status }));
        },
      },
      {
        token: SERVICES.TRACER,
        provider: { useValue: trace.getTracer(SERVICE_NAME) },
        postInjectionHook(): void {
          // getTracing() is deferred to cleanup time because tracing is only initialized
          // by the instrumentation file, which is not loaded in tests
          cleanupRegistry.register({
            id: SERVICES.TRACER,
            func: async (): Promise<void> => {
              try {
                await getTracing().stop();
              } catch {
                // tracing was not initialized
              }
            },
          });
        },
      },
      {
        token: SERVICES.METRICS,
        provider: {
          useFactory: instancePerContainerCachingFactory((container) => {
            const metricsRegistry = new Registry();
            const config = container.resolve<ConfigType>(SERVICES.CONFIG);
            config.initializeMetrics(metricsRegistry);
            return metricsRegistry;
          }),
        },
      },
      {
        token: SERVICES.OBJECT_STORAGE,
        provider: {
          useFactory: (container): IObjectStorageConfig => container.resolve<ConfigType>(SERVICES.CONFIG).get('objectStorage'),
        },
      },
      {
        token: ON_SIGNAL,
        provider: {
          useValue: cleanupRegistry.trigger.bind(cleanupRegistry),
        },
      },
      {
        token: DB_CONNECTION_PROVIDER,
        provider: { useFactory: instancePerContainerCachingFactory(connectionFactory) },
        postInjectionHook: async (container: DependencyContainer): Promise<void> => {
          const connection = container.resolve<Connection>(DB_CONNECTION_PROVIDER);
          if (!connection.isConnected) {
            await connection.connect();
            cleanupRegistry.register({ id: DB_CONNECTION_PROVIDER, func: connection.close.bind(connection) });
          }
        },
      },
      { token: DUMP_METADATA_REPOSITORY_SYMBOL, provider: { useFactory: dumpMetadataRepositoryFactory } },
      { token: DUMP_METADATA_ROUTER_SYMBOL, provider: { useFactory: dumpMetadataRouterFactory } },
      { token: HEALTHCHECK, provider: { useFactory: healthCheckFactory } },
    ];

    const container = await registerDependencies(dependencies, options?.override, options?.useChild);
    return container;
  } catch (error) {
    await cleanupRegistry.trigger();
    throw error;
  }
};
