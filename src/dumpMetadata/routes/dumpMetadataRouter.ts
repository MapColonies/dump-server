import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { DumpMetadataController } from '../controllers/dumpMetadataController';

const dumpMetadataRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(DumpMetadataController);

  router.get('/', controller.getByFilter);
  router.get('/:dumpId', controller.getById);

  return router;
};

export { dumpMetadataRouterFactory };
