// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'node:http';
import { createTerminus, type HealthCheck } from '@godaddy/terminus';
import type { Logger } from '@map-colonies/js-logger';
import type { DependencyContainer } from 'tsyringe';
import { HEALTHCHECK, ON_SIGNAL, SERVICES } from '@common/constants';
import type { ConfigType } from '@common/config';
import { getApp } from './app';

let depContainer: DependencyContainer | undefined;

void getApp()
  .then(([app, container]) => {
    depContainer = container;

    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = config.get('server.port');
    const healthCheck = container.resolve<HealthCheck>(HEALTHCHECK);
    const server = createTerminus(createServer(app), { healthChecks: { '/liveness': healthCheck }, onSignal: container.resolve(ON_SIGNAL) });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    if (depContainer?.isRegistered(SERVICES.LOGGER) === true) {
      const logger = depContainer.resolve<Logger>(SERVICES.LOGGER);
      logger.error({ msg: '😢 - failed initializing the server', err: error });
    } else {
      console.error('😢 - failed initializing the server');
      console.error(error);
    }
    process.exit(1);
  });
