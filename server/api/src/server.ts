// Entry point: config → repositories → createApp → listen.

import { randomUUID } from 'node:crypto';
import { JsonFileStore, JsonIssueRepository, JsonProjectRepository } from '@taskforge/storage';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const config = loadConfig(process.env);
const store = new JsonFileStore(config.dataFile);

const app = createApp({
  projects: new JsonProjectRepository(store),
  issues: new JsonIssueRepository(store),
  idGen: () => randomUUID(),
  clock: () => new Date(),
});

const server = app.listen(config.port, config.host, () => {
  console.log(
    `TaskForge API on http://${config.host}:${String(config.port)} (data: ${store.path})`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
  });
}
