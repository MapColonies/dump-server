import { ConnectionOptions } from 'typeorm';

export interface IApplicationConfig {
  auth: {
    enabled: boolean;
    token?: string;
  };
}

export type DbConfig = {
  enableSslAuth: boolean;
  sslPaths: { ca: string; cert: string; key: string };
} & ConnectionOptions;

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
