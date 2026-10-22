import { describe, expect, it } from 'vitest';
import {
  createIssueSchema,
  issueParamsSchema,
  listIssuesQuerySchema,
  patchIssueSchema,
} from '@taskforge/shared';

describe('createIssueSchema', () => {
  it('defaults status to open and keeps description optional', () => {
    expect(createIssueSchema.parse({ title: 'Bug', priority: 'low' })).toEqual({
      title: 'Bug',
      priority: 'low',
      status: 'open',
    });
  });

  it('requires priority', () => {
    expect(createIssueSchema.safeParse({ title: 'Bug' }).success).toBe(false);
  });

  it('trims and NFC-normalizes text', () => {
    const parsed = createIssueSchema.parse({
      title: `  ${'שָׁלוֹם'.normalize('NFD')}  `,
      description: ' תיאור ',
      priority: 'low',
    });
    expect(parsed.title).toBe('שָׁלוֹם'.normalize('NFC'));
    expect(parsed.description).toBe('תיאור');
  });

  it('limits title length in code points', () => {
    expect(createIssueSchema.safeParse({ title: '😀'.repeat(200), priority: 'low' }).success).toBe(
      true,
    );
    expect(createIssueSchema.safeParse({ title: 'a'.repeat(201), priority: 'low' }).success).toBe(
      false,
    );
  });

  it('limits description to 5000 code points', () => {
    const ok = { title: 't', priority: 'low', description: 'ש'.repeat(5000) };
    expect(createIssueSchema.safeParse(ok).success).toBe(true);
    expect(createIssueSchema.safeParse({ ...ok, description: 'ש'.repeat(5001) }).success).toBe(
      false,
    );
  });

  it('rejects unknown keys', () => {
    const result = createIssueSchema.safeParse({ title: 't', priority: 'low', projectId: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('patchIssueSchema', () => {
  it('accepts a single field without applying defaults', () => {
    expect(patchIssueSchema.parse({ priority: 'high' })).toEqual({ priority: 'high' });
  });

  it('rejects an empty object', () => {
    expect(patchIssueSchema.safeParse({}).success).toBe(false);
  });
});

describe('listIssuesQuerySchema', () => {
  it('applies pagination and sort defaults', () => {
    expect(listIssuesQuerySchema.parse({})).toEqual({
      limit: 20,
      offset: 0,
      sort: { field: 'createdAt', dir: 'desc' },
    });
  });

  it('coerces numbers and parses sort direction and filters', () => {
    expect(
      listIssuesQuerySchema.parse({
        limit: '5',
        offset: '10',
        sort: 'priority',
        status: 'open',
        priority: 'high',
      }),
    ).toEqual({
      limit: 5,
      offset: 10,
      sort: { field: 'priority', dir: 'asc' },
      status: 'open',
      priority: 'high',
    });
  });

  it('matches status and priority filters case-insensitively', () => {
    expect(listIssuesQuerySchema.parse({ status: 'IN_PROGRESS', priority: 'Low' })).toMatchObject({
      status: 'in_progress',
      priority: 'low',
    });
    expect(listIssuesQuerySchema.safeParse({ status: 'DONE' }).success).toBe(false);
  });

  it('rejects out-of-range pagination and unknown sort fields', () => {
    expect(listIssuesQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
    expect(listIssuesQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(listIssuesQuerySchema.safeParse({ limit: '1.5' }).success).toBe(false);
    expect(listIssuesQuerySchema.safeParse({ offset: '-1' }).success).toBe(false);
    expect(listIssuesQuerySchema.safeParse({ sort: '-id' }).success).toBe(false);
  });
});

describe('issueParamsSchema', () => {
  it('requires UUIDs', () => {
    const projectId = '00000000-0000-4000-8000-000000000001';
    expect(issueParamsSchema.safeParse({ projectId, issueId: projectId }).success).toBe(true);
    expect(issueParamsSchema.safeParse({ projectId, issueId: '1' }).success).toBe(false);
  });
});
