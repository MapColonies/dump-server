import type { ConnectionOptions } from 'typeorm';

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & ConnectionOptions;

export interface IObjectStorageConfig {
  protocol: string;
  host: string;
  port: string;
  projectId?: string;
}
