import { describe, expect, it } from 'vitest';
import { createProjectSchema, createIssueSchema } from '@taskforge/shared';
import { InMemoryIssueRepository, InMemoryProjectRepository } from '@taskforge/storage';
import { SEED_PROJECTS } from '../../src/seed/seed-data.ts';
import { seed } from '../../src/seed/seed.ts';
import { fakeIdGen } from '../helpers.ts';

const NOW = new Date('2026-10-23T12:00:00.000Z');
const everything = { limit: 100, offset: 0 } as const;

async function seeded() {
  const projects = new InMemoryProjectRepository();
  const issues = new InMemoryIssueRepository();
  const result = await seed({ projects, issues, idGen: fakeIdGen(), clock: () => NOW });
  return { projects, issues, result };
}

describe('seed data', () => {
  it('passes the same validation the API applies', () => {
    for (const project of SEED_PROJECTS) {
      expect(createProjectSchema.safeParse({ name: project.name }).success).toBe(true);
      for (const { title, description, status, priority } of project.issues) {
        const parsed = createIssueSchema.safeParse({ title, description, status, priority });
        expect(parsed.success, title).toBe(true);
      }
    }
  });
});

describe('seed', () => {
  it('creates three projects and about forty issues', async () => {
    const { projects, result } = await seeded();
    expect(result.projects).toBe(3);
    expect(result.issues).toBeGreaterThanOrEqual(38);
    const list = await projects.list({ ...everything, sort: { field: 'name', dir: 'asc' } });
    expect(list.items.map((p) => p.name)).toEqual(['Infrastructure', 'Payments', 'Web app']);
  });

  it('numbers issues in filing order and keeps every timestamp in the past', async () => {
    const { projects, issues } = await seeded();
    const [first] = (await projects.list({ ...everything, sort: { field: 'name', dir: 'asc' } }))
      .items;
    if (!first) throw new Error('no projects seeded');
    const page = await issues.listByProject(
      first.id,
      {},
      {
        ...everything,
        sort: { field: 'number', dir: 'asc' },
      },
    );
    const created = page.items.map((i) => i.createdAt);
    expect(created).toEqual([...created].sort());
    for (const issue of page.items) {
      expect(issue.updatedAt >= issue.createdAt).toBe(true);
      expect(Date.parse(issue.updatedAt)).toBeLessThanOrEqual(NOW.getTime());
    }
  });

  it('covers every status and priority', () => {
    const all = SEED_PROJECTS.flatMap((p) => p.issues);
    expect(new Set(all.map((i) => i.status))).toEqual(new Set(['open', 'in_progress', 'closed']));
    expect(new Set(all.map((i) => i.priority))).toEqual(new Set(['low', 'medium', 'high']));
  });
});
