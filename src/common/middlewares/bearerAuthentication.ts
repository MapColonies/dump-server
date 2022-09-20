import { Request, Response, NextFunction, Handler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'tsyringe';
import { IApplicationConfig } from '../interfaces';
import { Services } from '../constants';

@injectable()
export class RequestBearerAuth {
  public constructor(@inject(Services.APPLICATION) private readonly appConfig: IApplicationConfig) {}

  public getBearerAuthMiddleware(): Handler {
    const configuredToken = this.appConfig.authToken;

    return (req: Request, res: Response, next: NextFunction): Response | void => {
      const authHeader = req.headers.authorization;
      if (authHeader !== undefined) {
        const token = authHeader.split(' ')[1];
        if (token === configuredToken) {
          return next();
        }
      }
      return res.sendStatus(StatusCodes.UNAUTHORIZED);
    };
  }
}
