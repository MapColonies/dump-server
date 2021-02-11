import { container } from 'tsyringe';
import { Application } from 'express';
import { registerExternalValues } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

async function getApp(): Promise<Application> {
  await registerExternalValues();
  return container.resolve(ServerBuilder).build();
}

export { getApp };
