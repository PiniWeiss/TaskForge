import { describe, expect, it } from 'vitest';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  patchProjectSchema,
} from '@taskforge/shared';

describe('createProjectSchema', () => {
  it('trims and NFC-normalizes the name and keeps description optional', () => {
    expect(createProjectSchema.parse({ name: `  ${'שָׁלוֹם'.normalize('NFD')} ` })).toEqual({
      name: 'שָׁלוֹם'.normalize('NFC'),
    });
  });

  it('rejects a blank name and unknown fields', () => {
    expect(createProjectSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createProjectSchema.safeParse({ name: 'x', id: 'y' }).success).toBe(false);
  });

  it('limits the name to 100 code points', () => {
    expect(createProjectSchema.safeParse({ name: '😀'.repeat(100) }).success).toBe(true);
    expect(createProjectSchema.safeParse({ name: 'a'.repeat(101) }).success).toBe(false);
  });
});

describe('patchProjectSchema', () => {
  it('accepts any subset of fields', () => {
    expect(patchProjectSchema.parse({ description: 'd' })).toEqual({ description: 'd' });
  });

  it('requires at least one field', () => {
    expect(patchProjectSchema.safeParse({}).success).toBe(false);
  });
});

describe('listProjectsQuerySchema', () => {
  it('defaults to name ascending with the standard page', () => {
    expect(listProjectsQuerySchema.parse({})).toEqual({
      limit: 20,
      offset: 0,
      sort: { field: 'name', dir: 'asc' },
    });
  });

  it('accepts descending name sort and rejects other fields', () => {
    expect(listProjectsQuerySchema.parse({ sort: '-name' }).sort).toEqual({
      field: 'name',
      dir: 'desc',
    });
    expect(listProjectsQuerySchema.safeParse({ sort: 'createdAt' }).success).toBe(false);
  });
});
