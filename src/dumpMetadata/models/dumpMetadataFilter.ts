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
