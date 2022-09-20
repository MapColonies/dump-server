import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { DumpMetadataController } from '../controllers/dumpMetadataController';
import { RequestBearerAuth } from '../../common/middlewares/bearerAuthentication';
import { Services } from '../../common/constants';
import { IApplicationConfig } from '../../common/interfaces';

export const dumpMetadataRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();

  const controller = dependencyContainer.resolve(DumpMetadataController);
  const requestAuth = dependencyContainer.resolve(RequestBearerAuth);
  const appConfig = dependencyContainer.resolve<IApplicationConfig>(Services.APPLICATION);

  router.get('/', controller.getByFilter);
  router.post('/', appConfig.auth.enabled ? [requestAuth.getBearerAuthMiddleware(), controller.post] : controller.post);
  router.get('/:dumpId', controller.getById);

  return router;
};

export const DUMP_METADATA_ROUTER_SYMBOL = Symbol('dumpMetadataRouterFactory');
