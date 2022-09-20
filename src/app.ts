import { DependencyContainer } from 'tsyringe';
import { Application } from 'express';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

export async function getApp(registerOptions?: RegisterOptions): Promise<[DependencyContainer, Application]> {
  const container = await registerExternalValues(registerOptions);
  const app = container.resolve(ServerBuilder).build();
  return [container, app];
}
