import { ILogMethod } from '@map-colonies/mc-logger';
import { ConnectionOptions } from 'typeorm';

export interface IServerConfig {
  port: string;
}

export interface IApplicationConfig {
  authToken: string;
}

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & ConnectionOptions;

export interface ILogger {
  log: ILogMethod;
}

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IObjectStorageConfig {
  protocol: string;
  host: string;
  projectId?: string;
  port: string;
}
