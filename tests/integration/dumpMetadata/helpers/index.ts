import { Repository } from 'typeorm';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { DumpMetadata } from '../../../../src/dumpMetadata/DAL/typeorm/dumpMetadata';
import { createMultipleFakeDumpsMetadata } from '../../../helpers';
import { RegisterOptions } from '../../../../src/containerConfig';
import { Services } from '../../../../src/common/constants';

export const HAPPY_PATH = 'Happy Path 🙂';
export const SAD_PATH = 'Sad Path 😥';
export const BAD_PATH = 'Bad Path 😡';

export const BEFORE_ALL_TIMEOUT = 20000;

export const generateDumpsMetadataOnDb = async (repository: Repository<DumpMetadata>, amount: number): Promise<DumpMetadata[]> => {
  const createdDumpsMetadata = repository.create(createMultipleFakeDumpsMetadata(amount));
  return repository.save(createdDumpsMetadata);
};

export const getBaseRegisterOptions = (): Required<RegisterOptions> => {
  return {
    override: [
      { token: Services.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      { token: Services.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
    ],
    useChild: true,
  };
};
