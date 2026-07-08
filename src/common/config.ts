import { type ConfigInstance, config } from '@map-colonies/config';
import { commonBoilerplateV3, type commonBoilerplateV3Type } from '@map-colonies/schemas';
import type { DbConfig, IObjectStorageConfig } from './interfaces';

// The service does not have a dedicated schema in @map-colonies/schemas yet, so the common boilerplate
// schema is used for validation and the service specific config sections are only typed locally.
interface ServiceConfig {
  db: DbConfig;
  objectStorage: IObjectStorageConfig;
}

// Choose here the type of the config instance and import this type from the entire application
type ConfigType = ConfigInstance<commonBoilerplateV3Type & ServiceConfig>;

let configInstance: ConfigType | undefined;

/**
 * Initializes the configuration by fetching it from the server.
 * This should only be called from the instrumentation file.
 * @returns A Promise that resolves when the configuration is successfully initialized.
 */
async function initConfig(offlineMode?: boolean): Promise<void> {
  configInstance = (await config({
    schema: commonBoilerplateV3,
    offlineMode,
  })) as unknown as ConfigType;
}

function getConfig(): ConfigType {
  if (!configInstance) {
    throw new Error('config not initialized');
  }
  return configInstance;
}

export { getConfig, initConfig };
export type { ConfigType };
