// `npm run seed [-- --force]`: writes the demo data into DATA_FILE (default server/api/data/taskforge.json).

import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { JsonFileStore, JsonIssueRepository, JsonProjectRepository } from '@taskforge/storage';
import { loadConfig } from '../config.ts';
import { seed } from './seed.ts';

const force = process.argv.includes('--force');
const { dataFile } = loadConfig(process.env);

let store = new JsonFileStore(dataFile);
const existing = await new JsonProjectRepository(store).list({
  limit: 1,
  offset: 0,
  sort: { field: 'name', dir: 'asc' },
});

if (existing.total > 0) {
  if (!force) {
    console.error(
      `${dataFile} already has ${String(existing.total)} project(s). Run with --force to replace it.`,
    );
    process.exit(1);
  }
  await rm(dataFile);
  store = new JsonFileStore(dataFile);
}

const result = await seed({
  projects: new JsonProjectRepository(store),
  issues: new JsonIssueRepository(store),
  idGen: () => randomUUID(),
  clock: () => new Date(),
});
console.log(
  `Seeded ${String(result.projects)} projects and ${String(result.issues)} issues into ${dataFile}`,
);
