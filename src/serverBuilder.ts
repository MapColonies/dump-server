import { readFileSync } from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
import { Logger } from '@map-colonies/js-logger';
import httpLogger from '@map-colonies/express-access-log-middleware';
import { OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { load } from 'js-yaml';
import { merge } from 'lodash';
import { inject, injectable } from 'tsyringe';
import { Services } from './common/constants';
import { IApplicationConfig, IConfig, OpenApiConfig } from './common/interfaces';
import { DUMP_METADATA_ROUTER_SYMBOL } from './dumpMetadata/routes/dumpMetadataRouter';

interface JsonObject {
  [key: string]: unknown;
}

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;
  private openapiSpec: JsonObject = {};

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    @inject(Services.LOGGER) private readonly logger: Logger,
    @inject(DUMP_METADATA_ROUTER_SYMBOL) private readonly dumpsRouter: express.Router,
    @inject(Services.APPLICATION) private readonly appConfig: IApplicationConfig
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.buildOpenapiSpec(this.buildOpenapiOverride());
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildOpenapiOverride(): JsonObject | undefined {
    if (!this.appConfig.auth.enabled) {
      return undefined;
    }

    return {
      paths: {
        ['/dumps']: {
          post: {
            security: [
              {
                bearerAuth: [],
              },
            ],
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    };
  }

  private buildOpenapiSpec(override?: JsonObject): void {
    const openapiSpecFilePath = this.config.get<string>('openapiConfig.filePath');

    const openapiSpecContent = readFileSync(openapiSpecFilePath, 'utf8');
    let openapiSpec = load(openapiSpecContent) as JsonObject;

    if (override) {
      openapiSpec = merge(openapiSpec, override);
    }

    this.openapiSpec = openapiSpec;
  }

  private buildDocsRoutes(): void {
    const openapiRouterConfig = this.config.get<OpenApiConfig>('openapiConfig');
    const openapiRouter = new OpenapiViewerRouter({ ...openapiRouterConfig, filePathOrSpec: this.openapiSpec });

    openapiRouter.setup();

    this.serverInstance.use(this.config.get<string>('openapiConfig.basePath'), openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    this.buildDocsRoutes();
    this.serverInstance.use('/dumps', this.dumpsRouter);
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(httpLogger({ logger: this.logger }));
    if (this.config.get<boolean>('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get<compression.CompressionFilter>('server.response.compression.options')));
    }
    this.serverInstance.use(express.json(this.config.get<bodyParser.Options>('server.request.payload')));

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: this.openapiSpec, validateRequests: true, ignorePaths: ignorePathRegex }));
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
