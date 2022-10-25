import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { DumpMetadataController } from '../controllers/dumpMetadataController';

export const dumpMetadataRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();

  const controller = dependencyContainer.resolve(DumpMetadataController);

  router.get('/', controller.getByFilter);
  router.post('/', controller.post);
  router.get('/:dumpId', controller.getById);

  return router;
};

export const DUMP_METADATA_ROUTER_SYMBOL = Symbol('dumpMetadataRouterFactory');
