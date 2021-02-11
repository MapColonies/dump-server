import { ILogMethod } from '@map-colonies/mc-logger';

export interface IServerConfig {
  port: string;
}

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

export interface IStorageConfig {
  protocol: string;
  host: string;
}
