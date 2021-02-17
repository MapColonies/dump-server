export type SortFilter = 'asc' | 'desc';

export interface DumpMetadataFilter {
  limit: number;
  from?: Date;
  to?: Date;
  sort: SortFilter;
}
