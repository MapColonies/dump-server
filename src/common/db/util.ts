import { Between, FindOperator, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export const buildTimestampRangeFilter = (from?: Date, to?: Date): FindOperator<Date> | undefined => {
  if (from && to) {
    return Between(from, to);
  } else if (from && !to) {
    return MoreThanOrEqual(from);
  } else if (!from && to) {
    return LessThanOrEqual(to);
  }
  return undefined;
};
