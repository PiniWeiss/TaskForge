import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryIssueRepository, InMemoryProjectRepository } from '@taskforge/storage';
import { ConflictError, NotFoundError } from '../../src/errors/index.ts';
import { IssueService } from '../../src/services/issue.service.ts';
import { ProjectService } from '../../src/services/project.service.ts';
import { fakeClock, fakeIdGen } from '../helpers.ts';

const MISSING_ID = '99999999-9999-4999-8999-999999999999';

let projects: InMemoryProjectRepository;
let issues: InMemoryIssueRepository;
let service: ProjectService;
let issueService: IssueService;

beforeEach(() => {
  projects = new InMemoryProjectRepository();
  issues = new InMemoryIssueRepository();
  const deps = { projects, issues, idGen: fakeIdGen(), clock: fakeClock() };
  service = new ProjectService(deps);
  issueService = new IssueService(deps);
});

describe('ProjectService.create', () => {
  it('builds the entity with injected id and clock', async () => {
    const project = await service.create({ name: 'Payments' });
    expect(project).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Payments',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(await projects.findById(project.id)).toEqual(project);
  });

  it('rejects a name that differs only by case or Unicode normalization', async () => {
    await service.create({ name: 'שָׁלוֹם Café' });
    await expect(service.create({ name: 'שָׁלוֹם CAFÉ'.normalize('NFD') })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });
});

describe('ProjectService.patch', () => {
  it('merges fields, keeps createdAt and bumps updatedAt', async () => {
    const created = await service.create({ name: 'A', description: 'keep' });
    const updated = await service.patch(created.id, { name: 'B' });
    expect(updated).toEqual({ ...created, name: 'B', updatedAt: '2026-01-01T00:01:00.000Z' });
  });

  it('lets a project keep its own name with different casing', async () => {
    const created = await service.create({ name: 'Infra' });
    expect((await service.patch(created.id, { name: 'INFRA' })).name).toBe('INFRA');
  });

  it('rejects the name of another project', async () => {
    await service.create({ name: 'Web' });
    const other = await service.create({ name: 'Mobile' });
    await expect(service.patch(other.id, { name: 'web' })).rejects.toMatchObject({
      code: 'CONFLICT',
      params: { name: 'Web' },
    });
  });

  it('throws NotFoundError for an unknown project', async () => {
    await expect(service.patch(MISSING_ID, { name: 'x' })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ProjectService.replace', () => {
  it('clears an omitted description and keeps createdAt', async () => {
    const created = await service.create({ name: 'A', description: 'drop' });
    const replaced = await service.replace(created.id, { name: 'A' });
    expect(replaced).not.toHaveProperty('description');
    expect(replaced.createdAt).toBe(created.createdAt);
  });
});

describe('ProjectService.delete', () => {
  it('cascades to the issues of that project only', async () => {
    const doomed = await service.create({ name: 'Doomed' });
    const kept = await service.create({ name: 'Kept' });
    const a = await issueService.create(doomed.id, { title: 'a', priority: 'low', status: 'open' });
    const b = await issueService.create(kept.id, { title: 'b', priority: 'low', status: 'open' });

    await service.delete(doomed.id);

    expect(await projects.findById(doomed.id)).toBeNull();
    expect(await issues.findById(a.id)).toBeNull();
    expect(await issues.findById(b.id)).not.toBeNull();
  });

  it('throws NotFoundError for an unknown project', async () => {
    await expect(service.delete(MISSING_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});
