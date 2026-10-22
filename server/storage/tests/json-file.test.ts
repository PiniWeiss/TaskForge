import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  CURRENT_VERSION,
  JsonFileStore,
  JsonIssueRepository,
  JsonProjectRepository,
  StoreFormatError,
  migrate,
} from '@taskforge/storage';
import {
  describeIssueRepositoryContract,
  describeProjectRepositoryContract,
} from '@taskforge/storage/testing';

const root = await mkdtemp(join(tmpdir(), 'taskforge-json-'));
let counter = 0;

function freshPath(): string {
  return join(root, `case-${String(++counter)}`, 'data.json');
}

afterAll(async () => {
  await rm(root, { recursive: true, force: true });
});

describeProjectRepositoryContract(
  'JsonProjectRepository',
  () => new JsonProjectRepository(new JsonFileStore(freshPath())),
);
describeIssueRepositoryContract(
  'JsonIssueRepository',
  () => new JsonIssueRepository(new JsonFileStore(freshPath())),
);

const PROJECT_ID = '10000000-0000-4000-8000-000000000001';

function newIssue(n: number, title: string) {
  const at = new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString();
  return {
    id: `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    projectId: PROJECT_ID,
    title,
    status: 'open',
    priority: 'medium',
    createdAt: at,
    updatedAt: at,
  } as const;
}

describe('JsonFileStore', () => {
  let path: string;

  beforeEach(() => {
    path = freshPath();
  });

  it('creates a missing file with an empty current-version document', async () => {
    const repo = new JsonProjectRepository(new JsonFileStore(path));
    expect(
      (await repo.list({ limit: 20, offset: 0, sort: { field: 'name', dir: 'asc' } })).total,
    ).toBe(0);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      version: CURRENT_VERSION,
      projects: [],
      issues: [],
      issueCounters: {},
    });
  });

  it('persists data across store instances, including Hebrew text and issue counters', async () => {
    const first = new JsonIssueRepository(new JsonFileStore(path));
    await first.create(newIssue(1, 'שָׁלוֹם – checkout 🐛'));
    const second = await first.create(newIssue(2, 'second'));
    await first.delete(second.id);

    const reopened = new JsonIssueRepository(new JsonFileStore(path));
    expect((await reopened.findById(newIssue(1, '').id))?.title).toBe('שָׁלוֹם – checkout 🐛');
    expect((await reopened.create(newIssue(3, 'third'))).number).toBe(3);
  });

  it('serializes concurrent writes so none are lost', async () => {
    const repo = new JsonIssueRepository(new JsonFileStore(path));
    const created = await Promise.all(
      Array.from({ length: 25 }, (_, i) => repo.create(newIssue(i + 1, `Issue ${String(i + 1)}`))),
    );
    expect(new Set(created.map((i) => i.number)).size).toBe(25);

    const onDisk = JSON.parse(await readFile(path, 'utf8')) as { issues: unknown[] };
    expect(onDisk.issues).toHaveLength(25);
  });

  it('writes atomically and leaves no temp file behind', async () => {
    const repo = new JsonIssueRepository(new JsonFileStore(path));
    await repo.create(newIssue(1, 'a'));
    const dir = join(path, '..');
    expect(await readdir(dir)).toEqual(['data.json']);
  });

  it('keeps the cache unchanged when a change throws', async () => {
    const store = new JsonFileStore(path);
    const repo = new JsonIssueRepository(store);
    await repo.create(newIssue(1, 'kept'));
    await expect(
      store.write((data) => {
        data.issues = [];
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect((await repo.findById(newIssue(1, '').id))?.title).toBe('kept');
  });

  it('rejects a file with an unsupported version', async () => {
    await writeFile(join(root, 'v99.json'), JSON.stringify({ version: 99 }), 'utf8');
    const repo = new JsonProjectRepository(new JsonFileStore(join(root, 'v99.json')));
    await expect(repo.findById(PROJECT_ID)).rejects.toBeInstanceOf(StoreFormatError);
  });
});

describe('migrate', () => {
  it('accepts a current-version document as is', () => {
    const doc = { version: CURRENT_VERSION, projects: [], issues: [], issueCounters: {} };
    expect(migrate(doc)).toEqual(doc);
  });

  it('rejects non-objects, unknown versions and missing collections', () => {
    expect(() => migrate([])).toThrow(StoreFormatError);
    expect(() => migrate({ version: 0 })).toThrow('Unsupported data file version: 0');
    expect(() => migrate({ version: CURRENT_VERSION, projects: [] })).toThrow(StoreFormatError);
  });
});
