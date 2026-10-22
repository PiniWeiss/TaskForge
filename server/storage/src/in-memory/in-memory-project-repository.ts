// In-memory ProjectRepository (tests / dev).

import type { Page, Project } from '@taskforge/shared';
import { compareProjects, normalizeName, paginate } from '../list.ts';
import type { ListOptions, ProjectRepository } from '../types.ts';

export class InMemoryProjectRepository implements ProjectRepository {
  readonly #projects = new Map<string, Project>();

  list(opts: ListOptions<'name'>): Promise<Page<Project>> {
    const sorted = [...this.#projects.values()].sort(compareProjects(opts.sort));
    const page = paginate(sorted, opts);
    return Promise.resolve({ ...page, items: page.items.map((p) => structuredClone(p)) });
  }

  findById(id: string): Promise<Project | null> {
    const project = this.#projects.get(id);
    return Promise.resolve(project ? structuredClone(project) : null);
  }

  findByNormalizedName(name: string): Promise<Project | null> {
    const wanted = normalizeName(name);
    for (const project of this.#projects.values()) {
      if (normalizeName(project.name) === wanted) return Promise.resolve(structuredClone(project));
    }
    return Promise.resolve(null);
  }

  create(project: Project): Promise<Project> {
    this.#projects.set(project.id, structuredClone(project));
    return Promise.resolve(structuredClone(project));
  }

  update(id: string, data: Omit<Project, 'id'>): Promise<Project | null> {
    if (!this.#projects.has(id)) return Promise.resolve(null);
    const updated: Project = { ...structuredClone(data), id };
    this.#projects.set(id, updated);
    return Promise.resolve(structuredClone(updated));
  }

  delete(id: string): Promise<boolean> {
    return Promise.resolve(this.#projects.delete(id));
  }
}
