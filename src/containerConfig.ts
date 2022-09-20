import { DependencyContainer, instancePerContainerCachingFactory } from 'tsyringe';
import { Connection, Repository } from 'typeorm';
import config from 'config';
import { trace } from '@opentelemetry/api';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { dumpMetadataRouterFactory, DUMP_METADATA_ROUTER_SYMBOL } from './dumpMetadata/routes/dumpMetadataRouter';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { Services } from './common/constants';
import { IApplicationConfig, IObjectStorageConfig } from './common/interfaces';
import { connectionFactory, getDbHealthCheckFunction } from './common/db';
import { ShutdownHandler } from './common/shutdownHandler';
import { DumpMetadata, DUMP_METADATA_REPOSITORY_SYMBOL } from './dumpMetadata/DAL/typeorm/dumpMetadata';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const shutdownHandler = new ShutdownHandler();

  try {
    const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
    // @ts-expect-error the signature is wrong
    const logger = jsLogger({ ...loggerConfig, hooks: { logMethod } });

    const metrics = new Metrics('app');
    const meter = metrics.start();

    const tracer = trace.getTracer('app');

    const objectStorageConfig = config.get<IObjectStorageConfig>('objectStorage');

    const applicationConfig = config.get<IApplicationConfig>('application');

    const dependencies: InjectionObject<unknown>[] = [
      { token: Services.CONFIG, provider: { useValue: config } },
      { token: Services.LOGGER, provider: { useValue: logger } },
      { token: Services.TRACER, provider: { useValue: tracer } },
      { token: Services.METER, provider: { useValue: meter } },
      { token: Services.OBJECT_STORAGE, provider: { useValue: objectStorageConfig } },
      { token: Services.APPLICATION, provider: { useValue: applicationConfig } },
      {
        token: Connection,
        provider: { useFactory: instancePerContainerCachingFactory(connectionFactory) },
        postInjectionHook: async (container: DependencyContainer): Promise<void> => {
          const connection = container.resolve<Connection>(Connection);
          shutdownHandler.addFunction(connection.close.bind(connection));
          await connection.connect();
        },
      },
      {
        token: DUMP_METADATA_REPOSITORY_SYMBOL,
        provider: {
          useFactory: (container): Repository<DumpMetadata> => {
            const connection = container.resolve<Connection>(Connection);
            const repository = connection.getRepository(DumpMetadata);
            return repository;
          },
        },
      },
      { token: DUMP_METADATA_ROUTER_SYMBOL, provider: { useFactory: dumpMetadataRouterFactory } },
      {
        token: 'healthcheck',
        provider: { useFactory: (container): unknown => getDbHealthCheckFunction(container.resolve<Connection>(Connection)) },
      },
      {
        token: 'onSignal',
        provider: {
          useValue: {
            useValue: async (): Promise<void> => {
              await Promise.all([tracing.stop(), metrics.stop()]);
            },
          },
        },
      },
    ];

    const container = await registerDependencies(dependencies, options?.override, options?.useChild);
    return container;
  } catch (error) {
    await shutdownHandler.onShutdown();
    throw error;
  }
};
