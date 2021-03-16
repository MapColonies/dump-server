import { Repository, QueryFailedError } from 'typeorm';
import faker from 'faker';

import { DumpMetadata, DumpMetadataResponse, IDumpMetadata } from '../../../../src/dumpMetadata/models/dumpMetadata';
import { DumpMetadataManager } from '../../../../src/dumpMetadata/models/dumpMetadataManager';
import {
  createFakeDumpMetadata,
  BOTTOM_FROM,
  TOP_TO,
  getDefaultFilterQueryParams,
  mockObjectStorageConfig,
  convertFakesToResponses,
  convertFakeToResponse,
  sortByOrderFilter,
} from '../../../helpers';
import { DumpNotFoundError } from '../../../../src/dumpMetadata/models/errors';
import { DumpMetadataFilter } from '../../../../src/dumpMetadata/models/dumpMetadataFilter';
import { getDefaultFilter } from '../../helpers';

let dumpMetadataManager: DumpMetadataManager;

describe('dumpMetadataManager', () => {
  let find: jest.Mock;
  let findOne: jest.Mock;
  let insert: jest.Mock;

  beforeEach(function () {
    find = jest.fn();
    findOne = jest.fn();
    insert = jest.fn();

    const repository = ({ find, findOne, insert } as unknown) as Repository<DumpMetadata>;
    dumpMetadataManager = new DumpMetadataManager(repository, { log: jest.fn() }, mockObjectStorageConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#getDumpMetadataByFilter', () => {
    it.each([
      [BOTTOM_FROM, undefined],
      [undefined, TOP_TO],
      [BOTTOM_FROM, TOP_TO],
      [undefined, undefined],
    ])(
      'should return the filtered dumpsMetadatas in any case of filtering by from(0), to(1), both(2) or none(3) (%#)',
      async function (from: Date | undefined, to: Date | undefined) {
        const dumpsMetadata = [createFakeDumpMetadata(), createFakeDumpMetadata(), createFakeDumpMetadata()];
        const filter: DumpMetadataFilter = { ...getDefaultFilterQueryParams(), from, to };

        find.mockReturnValue(sortByOrderFilter(dumpsMetadata, filter.sort));

        const getByFilterPromise = dumpMetadataManager.getDumpsMetadataByFilter(filter);

        const dumpsMetadataResponses: DumpMetadataResponse[] = convertFakesToResponses(dumpsMetadata);

        await expect(getByFilterPromise).resolves.toEqual(sortByOrderFilter(dumpsMetadataResponses, filter.sort));
      }
    );

    it('should return the empty array response', async function () {
      const dumpsMetadata: IDumpMetadata[] = [];
      find.mockReturnValue(dumpsMetadata);

      const getByFilterPromise = dumpMetadataManager.getDumpsMetadataByFilter(getDefaultFilter());

      await expect(getByFilterPromise).resolves.toEqual([]);
    });

    it('should reject on DB error', async () => {
      find.mockRejectedValue(new QueryFailedError('', undefined, new Error()));

      const getByFilterPromise = dumpMetadataManager.getDumpsMetadataByFilter(getDefaultFilter());

      await expect(getByFilterPromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#getDumpMetadataById', () => {
    it('should return the dumpMetadata', async function () {
      const dumpMetadata = createFakeDumpMetadata();
      findOne.mockResolvedValue(dumpMetadata);

      const getPromise = dumpMetadataManager.getDumpMetadataById(dumpMetadata.id);

      const dumpMetadataResponse = convertFakeToResponse(dumpMetadata);

      await expect(getPromise).resolves.toStrictEqual(dumpMetadataResponse);
    });

    it('should throw DumpNotFoundError if dumpMetadata with the given id was not found', async () => {
      findOne.mockReturnValue(undefined);
      const dumpMetadata = createFakeDumpMetadata();

      const getPromise = dumpMetadataManager.getDumpMetadataById(dumpMetadata.id);

      await expect(getPromise).rejects.toThrow(DumpNotFoundError);
    });

    it('should reject on DB error', async () => {
      findOne.mockRejectedValue(new QueryFailedError('', undefined, new Error()));

      const getPromise = dumpMetadataManager.getDumpMetadataById(faker.random.uuid());

      await expect(getPromise).rejects.toThrow(QueryFailedError);
    });
  });

  describe('#createDumpMetadata', () => {
    it('should resolves without errors', async () => {
      const dumpMetadata = createFakeDumpMetadata();
      const { id, ...rest } = dumpMetadata;
      insert.mockResolvedValue({ identifiers: [id] });
      const createPromise = dumpMetadataManager.createDumpMetadata(rest);

      await expect(createPromise).resolves.not.toThrow();
    });

    it('should reject on DB error', async () => {
      insert.mockRejectedValue(new QueryFailedError('', undefined, new Error()));

      const dumpMetadata = createFakeDumpMetadata();
      const { id, ...rest } = dumpMetadata;
      const createPromise = dumpMetadataManager.createDumpMetadata(rest);

      await expect(createPromise).rejects.toThrow(QueryFailedError);
    });
  });
});
