import type { Repository } from 'typeorm';
import { jsLogger } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import type { DumpMetadata } from '@src/dumpMetadata/DAL/typeorm/dumpMetadata';
import type { RegisterOptions } from '@src/containerConfig';
import { SERVICES } from '@common/constants';
import { createMultipleFakeDumpsMetadata } from '../../../helpers';

const HAPPY_PATH = 'Happy Path 🙂';
const SAD_PATH = 'Sad Path 😥';
const BAD_PATH = 'Bad Path 😡';

const BEFORE_ALL_TIMEOUT = 20000;

const generateDumpsMetadataOnDb = async (repository: Repository<DumpMetadata>, amount: number): Promise<DumpMetadata[]> => {
  const createdDumpsMetadata = repository.create(createMultipleFakeDumpsMetadata(amount));
  return repository.save(createdDumpsMetadata);
};

const getBaseRegisterOptions = async (): Promise<Required<RegisterOptions>> => {
  return {
    override: [
      { token: SERVICES.LOGGER, provider: { useValue: await jsLogger({ enabled: false }) } },
      { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
    ],
    useChild: true,
  };
};

export { HAPPY_PATH, SAD_PATH, BAD_PATH, BEFORE_ALL_TIMEOUT, generateDumpsMetadataOnDb, getBaseRegisterOptions };
