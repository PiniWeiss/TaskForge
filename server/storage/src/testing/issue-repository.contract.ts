// Reusable contract test suite for any IssueRepository implementation.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Issue } from '@taskforge/shared';
import type { IssueRepository, IssueSortField, ListOptions, NewIssue } from '../types.ts';

const P1 = '10000000-0000-4000-8000-000000000001';
const P2 = '10000000-0000-4000-8000-000000000002';

function issue(n: number, overrides: Partial<NewIssue> = {}): NewIssue {
  const at = new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString();
  return {
    id: `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    projectId: P1,
    title: `Issue ${String(n)}`,
    status: 'open',
    priority: 'medium',
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

function opts(
  sort: ListOptions<IssueSortField>['sort'] = { field: 'createdAt', dir: 'asc' },
  limit = 20,
  offset = 0,
): ListOptions<IssueSortField> {
  return { limit, offset, sort };
}

export function describeIssueRepositoryContract(
  name: string,
  createRepository: () => IssueRepository | Promise<IssueRepository>,
): void {
  describe(`${name} (IssueRepository contract)`, () => {
    let repo: IssueRepository;

    beforeEach(async () => {
      repo = await createRepository();
    });

    function titlesOf(items: Issue[]): string[] {
      return items.map((i) => i.title);
    }

    it('creates and finds an issue by id', async () => {
      const created = await repo.create(issue(1, { description: 'תיאור 🐛' }));
      expect(created).toEqual({ ...issue(1, { description: 'תיאור 🐛' }), number: 1 });
      expect(await repo.findById(created.id)).toEqual(created);
    });

    it('returns null for an unknown id', async () => {
      expect(await repo.findById(issue(9).id)).toBeNull();
    });

    it('does not expose internal state to callers', async () => {
      const created = await repo.create(issue(1));
      created.title = 'mutated';
      const found = await repo.findById(issue(1).id);
      expect(found?.title).toBe('Issue 1');
      if (found) found.title = 'mutated again';
      expect((await repo.findById(issue(1).id))?.title).toBe('Issue 1');
    });

    it('numbers issues per project starting at 1', async () => {
      const a = await repo.create(issue(1));
      const b = await repo.create(issue(2, { projectId: P2 }));
      const c = await repo.create(issue(3));
      expect([a.number, b.number, c.number]).toEqual([1, 1, 2]);
    });

    it('never reuses a number, even after the newest issue is deleted', async () => {
      await repo.create(issue(1));
      const second = await repo.create(issue(2));
      await repo.delete(second.id);
      expect((await repo.create(issue(3))).number).toBe(3);
    });

    it('lists only the issues of the given project with a total', async () => {
      await repo.create(issue(1));
      await repo.create(issue(2, { projectId: P2 }));
      await repo.create(issue(3));
      const page = await repo.listByProject(P1, {}, opts());
      expect(titlesOf(page.items)).toEqual(['Issue 1', 'Issue 3']);
      expect(page.total).toBe(2);
    });

    it('filters by status and priority', async () => {
      await repo.create(issue(1, { status: 'open', priority: 'high' }));
      await repo.create(issue(2, { status: 'closed', priority: 'high' }));
      await repo.create(issue(3, { status: 'open', priority: 'low' }));

      const byStatus = await repo.listByProject(P1, { status: 'open' }, opts());
      expect(titlesOf(byStatus.items)).toEqual(['Issue 1', 'Issue 3']);
      const byPriority = await repo.listByProject(P1, { priority: 'high' }, opts());
      expect(titlesOf(byPriority.items)).toEqual(['Issue 1', 'Issue 2']);
      const both = await repo.listByProject(P1, { status: 'open', priority: 'high' }, opts());
      expect(titlesOf(both.items)).toEqual(['Issue 1']);
      expect(both.total).toBe(1);
    });

    it('searches titles case-insensitively and Unicode-normalized', async () => {
      await repo.create(issue(1, { title: 'Refund webhook times out' }));
      await repo.create(issue(2, { title: 'שָׁלוֹם checkout' }));
      await repo.create(issue(3, { title: 'Export CSV' }));

      const byWord = await repo.listByProject(P1, { q: 'WEBHOOK' }, opts());
      expect(titlesOf(byWord.items)).toEqual(['Refund webhook times out']);
      const hebrew = await repo.listByProject(P1, { q: 'שָׁלוֹם'.normalize('NFD') }, opts());
      expect(titlesOf(hebrew.items)).toEqual(['שָׁלוֹם checkout']);
      const none = await repo.listByProject(P1, { q: 'nothing' }, opts());
      expect(none).toEqual({ items: [], total: 0 });
    });

    it('finds an issue by number with or without #, combined with other filters', async () => {
      await repo.create(issue(1, { title: 'first', status: 'closed' }));
      await repo.create(issue(2, { title: 'second' }));
      expect(titlesOf((await repo.listByProject(P1, { q: '#2' }, opts())).items)).toEqual([
        'second',
      ]);
      expect(titlesOf((await repo.listByProject(P1, { q: '1' }, opts())).items)).toEqual(['first']);
      const filtered = await repo.listByProject(P1, { q: '1', status: 'open' }, opts());
      expect(filtered.total).toBe(0);
    });

    it('sorts by number', async () => {
      await repo.create(issue(3, { title: 'a' }));
      await repo.create(issue(1, { title: 'b' }));
      const desc = await repo.listByProject(P1, {}, opts({ field: 'number', dir: 'desc' }));
      expect(titlesOf(desc.items)).toEqual(['b', 'a']);
    });

    it('sorts by createdAt in both directions', async () => {
      await repo.create(issue(2));
      await repo.create(issue(1));
      await repo.create(issue(3));
      const desc = await repo.listByProject(P1, {}, opts({ field: 'createdAt', dir: 'desc' }));
      expect(titlesOf(desc.items)).toEqual(['Issue 3', 'Issue 2', 'Issue 1']);
    });

    it('sorts priority by rank and breaks ties by createdAt', async () => {
      await repo.create(issue(1, { title: 'h1', priority: 'high' }));
      await repo.create(issue(2, { title: 'l', priority: 'low' }));
      await repo.create(issue(3, { title: 'm', priority: 'medium' }));
      await repo.create(issue(4, { title: 'h2', priority: 'high' }));

      const asc = await repo.listByProject(P1, {}, opts({ field: 'priority', dir: 'asc' }));
      expect(titlesOf(asc.items)).toEqual(['l', 'm', 'h1', 'h2']);
      const desc = await repo.listByProject(P1, {}, opts({ field: 'priority', dir: 'desc' }));
      expect(titlesOf(desc.items)).toEqual(['h1', 'h2', 'm', 'l']);
    });

    it('sorts status in workflow order', async () => {
      await repo.create(issue(1, { title: 'c', status: 'closed' }));
      await repo.create(issue(2, { title: 'o', status: 'open' }));
      await repo.create(issue(3, { title: 'p', status: 'in_progress' }));
      const page = await repo.listByProject(P1, {}, opts({ field: 'status', dir: 'asc' }));
      expect(titlesOf(page.items)).toEqual(['o', 'p', 'c']);
    });

    it('sorts titles with Hebrew-aware collation', async () => {
      await repo.create(issue(1, { title: 'beta' }));
      await repo.create(issue(2, { title: 'בדיקה' }));
      await repo.create(issue(3, { title: 'Alpha' }));
      await repo.create(issue(4, { title: 'אבג' }));
      const page = await repo.listByProject(P1, {}, opts({ field: 'title', dir: 'asc' }));
      expect(titlesOf(page.items)).toEqual(['אבג', 'בדיקה', 'Alpha', 'beta']);
    });

    it('paginates after filtering and sorting', async () => {
      for (let n = 1; n <= 5; n++) await repo.create(issue(n));
      const page = await repo.listByProject(P1, {}, opts(undefined, 2, 1));
      expect(titlesOf(page.items)).toEqual(['Issue 2', 'Issue 3']);
      expect(page.total).toBe(5);
      const beyond = await repo.listByProject(P1, {}, opts(undefined, 2, 10));
      expect(beyond).toEqual({ items: [], total: 5 });
    });

    it('updates mutable fields and keeps id, projectId and createdAt', async () => {
      const created = await repo.create(issue(1, { description: 'old' }));
      const updated = await repo.update(created.id, {
        title: 'New',
        status: 'closed',
        priority: 'low',
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
      const expected: Issue = {
        id: created.id,
        projectId: created.projectId,
        number: created.number,
        createdAt: created.createdAt,
        title: 'New',
        status: 'closed',
        priority: 'low',
        updatedAt: '2026-02-01T00:00:00.000Z',
      };
      expect(updated).toEqual(expected);
      expect(await repo.findById(created.id)).toEqual(expected);
    });

    it('returns null when updating an unknown id', async () => {
      const { id: _id, projectId: _p, createdAt: _c, ...data } = issue(1);
      expect(await repo.update(issue(1).id, data)).toBeNull();
    });

    it('deletes an issue and reports whether it existed', async () => {
      await repo.create(issue(1));
      expect(await repo.delete(issue(1).id)).toBe(true);
      expect(await repo.findById(issue(1).id)).toBeNull();
      expect(await repo.delete(issue(1).id)).toBe(false);
    });

    it('deletes all issues of a project and returns the count', async () => {
      await repo.create(issue(1));
      await repo.create(issue(2));
      await repo.create(issue(3, { projectId: P2 }));
      expect(await repo.deleteByProject(P1)).toBe(2);
      expect((await repo.listByProject(P1, {}, opts())).total).toBe(0);
      expect((await repo.listByProject(P2, {}, opts())).total).toBe(1);
    });
  });
}
