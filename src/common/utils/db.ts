import config from 'config';
import { Between, Connection, ConnectionOptions, createConnection, FindOperator } from 'typeorm';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { format } from 'date-fns';

import { DumpMetadata } from '../../dumpMetadata/models/dumpMetadata';

export enum DateTypeFormat {
  DATE = 'yyyy-MM-dd',
  DATETIME = 'yyyy-MM-dd HH:MM:ss',
}

export const moreThanOrEqualTimestamp = (date: Date, type: DateTypeFormat): FindOperator<string> => MoreThanOrEqual(format(date, type));

export const lessThanOrEqualTimestamp = (date: Date, type: DateTypeFormat): FindOperator<string> => LessThanOrEqual(format(date, type));

export const betweenTimestamps = (from: Date, to: Date, type: DateTypeFormat): FindOperator<string> => Between(format(from, type), format(to, type));

export const ENTITIES_DIRS = [DumpMetadata];

export const initializeConnection = async (): Promise<Connection> => {
  const connectionOptions = config.get<ConnectionOptions>('db');
  return createConnection({ entities: ENTITIES_DIRS, ...connectionOptions });
};
