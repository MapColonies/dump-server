import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { DumpMetadataController } from '../controllers/dumpMetadataController';
import { RequestBearerAuth } from '../../common/middlewares/bearerAuthentication';

export const dumpMetadataRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();

  const controller = dependencyContainer.resolve(DumpMetadataController);
  const requestAuth = dependencyContainer.resolve(RequestBearerAuth);

  router.get('/', controller.getByFilter);
  router.post('/', requestAuth.getBearerAuthMiddleware(), controller.post);
  router.get('/:dumpId', controller.getById);

  return router;
};

export const DUMP_METADATA_ROUTER_SYMBOL = Symbol('dumpMetadataRouterFactory');
