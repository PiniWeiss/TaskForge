import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@taskforge/shared';
import { InMemoryIssueRepository, InMemoryProjectRepository } from '@taskforge/storage';
import { NotFoundError } from '../../src/errors/index.ts';
import { IssueService } from '../../src/services/issue.service.ts';
import { fakeClock, fakeIdGen } from '../helpers.ts';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';
const listAll = {
  filter: {},
  opts: { limit: 20, offset: 0, sort: { field: 'createdAt', dir: 'asc' } },
} as const;

let projects: InMemoryProjectRepository;
let issues: InMemoryIssueRepository;
let service: IssueService;
let project: Project;
let other: Project;

function seedProject(id: string, name: string): Promise<Project> {
  const now = '2025-12-31T00:00:00.000Z';
  return projects.create({ id, name, createdAt: now, updatedAt: now });
}

beforeEach(async () => {
  projects = new InMemoryProjectRepository();
  issues = new InMemoryIssueRepository();
  service = new IssueService({ projects, issues, idGen: fakeIdGen(), clock: fakeClock() });
  project = await seedProject('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Main');
  other = await seedProject('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Other');
});

describe('IssueService.create', () => {
  it('builds the entity with injected id and clock', async () => {
    const issue = await service.create(project.id, {
      title: 'Bug',
      priority: 'high',
      status: 'open',
    });
    expect(issue).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      projectId: project.id,
      number: 1,
      title: 'Bug',
      priority: 'high',
      status: 'open',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(await issues.findById(issue.id)).toEqual(issue);
  });

  it('throws NotFoundError for an unknown project', async () => {
    await expect(
      service.create(MISSING_ID, { title: 'x', priority: 'low', status: 'open' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('IssueService.get', () => {
  it('hides issues that belong to another project', async () => {
    const foreign = await service.create(other.id, { title: 'x', priority: 'low', status: 'open' });
    await expect(service.get(project.id, foreign.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      messageKey: 'error.notFound.issue',
    });
  });
});

describe('IssueService.list', () => {
  it('lists only the project issues', async () => {
    const mine = await service.create(project.id, { title: 'a', priority: 'low', status: 'open' });
    await service.create(other.id, { title: 'b', priority: 'low', status: 'open' });
    const page = await service.list(project.id, listAll.filter, listAll.opts);
    expect(page).toEqual({ items: [mine], total: 1 });
  });

  it('throws NotFoundError for an unknown project', async () => {
    await expect(service.list(MISSING_ID, listAll.filter, listAll.opts)).rejects.toMatchObject({
      messageKey: 'error.notFound.project',
    });
  });
});

describe('IssueService.patch', () => {
  it('merges the given fields and keeps id, projectId and createdAt', async () => {
    const created = await service.create(project.id, {
      title: 'x',
      description: 'keep',
      priority: 'low',
      status: 'open',
    });
    const updated = await service.patch(project.id, created.id, { status: 'in_progress' });
    expect(updated).toEqual({
      ...created,
      status: 'in_progress',
      updatedAt: '2026-01-01T00:01:00.000Z',
    });
  });
});

describe('IssueService.replace', () => {
  it('clears fields that are omitted from the replacement', async () => {
    const created = await service.create(project.id, {
      title: 'x',
      description: 'drop',
      priority: 'low',
      status: 'closed',
    });
    const replaced = await service.replace(project.id, created.id, {
      title: 'y',
      priority: 'high',
      status: 'open',
    });
    expect(replaced).not.toHaveProperty('description');
    expect(replaced).toMatchObject({ id: created.id, title: 'y', createdAt: created.createdAt });
  });
});

describe('IssueService.delete', () => {
  it('removes the issue', async () => {
    const created = await service.create(project.id, {
      title: 'x',
      priority: 'low',
      status: 'open',
    });
    await service.delete(project.id, created.id);
    expect(await issues.findById(created.id)).toBeNull();
  });

  it('does not delete an issue of another project', async () => {
    const foreign = await service.create(other.id, { title: 'x', priority: 'low', status: 'open' });
    await expect(service.delete(project.id, foreign.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await issues.findById(foreign.id)).not.toBeNull();
  });
});
