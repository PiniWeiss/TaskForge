import type { Issue, ListResponse } from '@taskforge/shared';
import { describe, expect, it } from 'vitest';
import { applyChanges, replaceInPage } from '../../src/api/issue-cache.ts';

function issue(n: number, overrides: Partial<Issue> = {}): Issue {
  return {
    id: `id-${String(n)}`,
    projectId: 'p',
    number: n,
    title: `Issue ${String(n)}`,
    status: 'open',
    priority: 'medium',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

function page(...issues: Issue[]): ListResponse<Issue> {
  return { data: issues, pagination: { total: issues.length, limit: 100, offset: 0 } };
}

describe('applyChanges', () => {
  it('applies only the given fields', () => {
    expect(applyChanges(issue(1, { description: 'keep' }), { status: 'closed' })).toEqual(
      issue(1, { description: 'keep', status: 'closed' }),
    );
  });

  it('treats an empty description as clearing it', () => {
    expect(applyChanges(issue(1, { description: 'old' }), { description: '' }).description).toBe(
      '',
    );
  });

  it('does not mutate the input', () => {
    const original = issue(1);
    applyChanges(original, { title: 'New' });
    expect(original.title).toBe('Issue 1');
  });
});

describe('replaceInPage', () => {
  it('replaces the matching issue and keeps order and pagination', () => {
    const before = page(issue(1), issue(2));
    const after = replaceInPage(before, 'id-2', (i) => ({ ...i, title: 'Renamed' }));
    expect(after?.data.map((i) => i.title)).toEqual(['Issue 1', 'Renamed']);
    expect(after?.pagination).toEqual(before.pagination);
  });

  it('returns pages without the issue unchanged, so React Query skips re-rendering them', () => {
    const other = page(issue(3));
    expect(replaceInPage(other, 'id-1', (i) => i)).toBe(other);
    expect(replaceInPage(undefined, 'id-1', (i) => i)).toBeUndefined();
  });
});
