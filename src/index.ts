// this import must be called before the first import of tsyring
import 'reflect-metadata';
import { createServer } from 'http';
import { DependencyContainer } from 'tsyringe';
import config from 'config';
import { Logger } from '@map-colonies/js-logger';
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import { getApp } from './app';
import { DEFAULT_SERVER_PORT, Services } from './common/constants';
import { ShutdownHandler } from './common/shutdownHandler';

let depContainer: DependencyContainer | undefined;

const port: number = config.get<number>('server.port') || DEFAULT_SERVER_PORT;

void getApp()
  .then(([container, app]) => {
    depContainer = container;

    const logger = depContainer.resolve<Logger>(Services.LOGGER);
    const healthCheck = depContainer.resolve<HealthCheck>('healthcheck');
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const server = createTerminus(createServer(app), { healthChecks: { '/liveness': healthCheck }, onSignal: depContainer.resolve('onSignal') });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch(async (error: Error) => {
    const errorLogger =
      depContainer?.isRegistered(Services.LOGGER) == true
        ? depContainer.resolve<Logger>(Services.LOGGER).error.bind(depContainer.resolve<Logger>(Services.LOGGER))
        : console.error;
    errorLogger({ msg: '😢 - failed initializing the server', err: error });

    if (depContainer?.isRegistered(ShutdownHandler) == true) {
      const shutdownHandler = depContainer.resolve(ShutdownHandler);
      await shutdownHandler.onShutdown();
    }
  });
