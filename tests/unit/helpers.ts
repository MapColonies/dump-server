import { DumpMetadataFilter } from '../../src/dumpMetadata/models/dumpMetadataFilter';
import { DEFAULT_LIMIT, DEFAULT_SORT } from '../helpers';

export const getDefaultFilter = (): DumpMetadataFilter => {
  return {
    sort: DEFAULT_SORT,
    limit: DEFAULT_LIMIT,
  };
};
