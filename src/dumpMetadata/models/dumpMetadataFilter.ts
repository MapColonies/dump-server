import { FindManyOptions } from 'typeorm';
import { buildTimestampRangeFilter } from '../../common/db/util';
import { DumpMetadata } from '../DAL/typeorm/dumpMetadata';

export type SortFilter = 'asc' | 'desc';

export interface DumpMetadataFilter {
  limit: number;
  from?: Date;
  to?: Date;
  sort: SortFilter;
}

export interface DumpMetadataFilterQueryParams extends Omit<DumpMetadataFilter, 'from' | 'to'> {
  from?: string;
  to?: string;
}

export const buildFilterQuery = (filter: DumpMetadataFilter): FindManyOptions<DumpMetadata> => {
  const findManyOptions: FindManyOptions<DumpMetadata> = {};
  // limit
  findManyOptions.take = filter.limit;

  // sort
  const order = filter.sort === 'asc' ? 'ASC' : 'DESC';
  findManyOptions.order = { timestamp: order };

  // to & from
  const timesFilter = buildTimestampRangeFilter(filter.from, filter.to);
  if (timesFilter) {
    findManyOptions.where = { timestamp: timesFilter };
  }
  return findManyOptions;
};
