// Reusable contract test suite for any ProjectRepository implementation.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '@taskforge/shared';
import type { ListOptions, ProjectRepository } from '../types.ts';

function project(n: number, overrides: Partial<Project> = {}): Project {
  const at = new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString();
  return {
    id: `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    name: `Project ${String(n)}`,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

function opts(dir: 'asc' | 'desc' = 'asc', limit = 20, offset = 0): ListOptions<'name'> {
  return { limit, offset, sort: { field: 'name', dir } };
}

export function describeProjectRepositoryContract(
  name: string,
  createRepository: () => ProjectRepository | Promise<ProjectRepository>,
): void {
  describe(`${name} (ProjectRepository contract)`, () => {
    let repo: ProjectRepository;

    beforeEach(async () => {
      repo = await createRepository();
    });

    it('creates and finds a project by id', async () => {
      const created = await repo.create(project(1, { name: 'פרויקט', description: 'd' }));
      expect(await repo.findById(created.id)).toEqual(created);
      expect(await repo.findById(project(2).id)).toBeNull();
    });

    it('finds by name case-insensitively and Unicode-normalized', async () => {
      const created = await repo.create(project(1, { name: 'Café שָׁלוֹם' }));
      expect(await repo.findByNormalizedName('CAFÉ שָׁלוֹם'.normalize('NFD'))).toEqual(created);
      expect(await repo.findByNormalizedName('other')).toBeNull();
    });

    it('lists sorted by name with pagination', async () => {
      await repo.create(project(1, { name: 'beta' }));
      await repo.create(project(2, { name: 'אלף' }));
      await repo.create(project(3, { name: 'Alpha' }));

      const asc = await repo.list(opts());
      expect(asc.items.map((p) => p.name)).toEqual(['אלף', 'Alpha', 'beta']);
      expect(asc.total).toBe(3);
      const page = await repo.list(opts('desc', 1, 1));
      expect(page.items.map((p) => p.name)).toEqual(['Alpha']);
    });

    it('updates a project and keeps its id', async () => {
      const created = await repo.create(project(1, { description: 'drop' }));
      const data = { name: 'Renamed', createdAt: created.createdAt, updatedAt: 'later' };
      expect(await repo.update(created.id, data)).toEqual({ id: created.id, ...data });
      expect(await repo.update(project(2).id, data)).toBeNull();
    });

    it('deletes a project and reports whether it existed', async () => {
      await repo.create(project(1));
      expect(await repo.delete(project(1).id)).toBe(true);
      expect(await repo.delete(project(1).id)).toBe(false);
      expect(await repo.findById(project(1).id)).toBeNull();
    });
  });
}
