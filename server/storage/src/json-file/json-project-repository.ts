// ProjectRepository backed by JsonFileStore.

import type { Page, Project } from '@taskforge/shared';
import { compareProjects, normalizeName, paginate } from '../list.ts';
import type { ListOptions, ProjectRepository } from '../types.ts';
import type { JsonFileStore } from './json-file-store.ts';

export class JsonProjectRepository implements ProjectRepository {
  readonly #store: JsonFileStore;

  constructor(store: JsonFileStore) {
    this.#store = store;
  }

  list(opts: ListOptions<'name'>): Promise<Page<Project>> {
    return this.#store.read((data) => {
      const sorted = [...data.projects].sort(compareProjects(opts.sort));
      return structuredClone(paginate(sorted, opts));
    });
  }

  findById(id: string): Promise<Project | null> {
    return this.#store.read((data) => {
      const project = data.projects.find((p) => p.id === id);
      return project ? structuredClone(project) : null;
    });
  }

  findByNormalizedName(name: string): Promise<Project | null> {
    const wanted = normalizeName(name);
    return this.#store.read((data) => {
      const project = data.projects.find((p) => normalizeName(p.name) === wanted);
      return project ? structuredClone(project) : null;
    });
  }

  create(project: Project): Promise<Project> {
    return this.#store.write((data) => {
      data.projects.push(structuredClone(project));
      return structuredClone(project);
    });
  }

  update(id: string, fields: Omit<Project, 'id'>): Promise<Project | null> {
    return this.#store.write((data) => {
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return null;
      const updated: Project = { ...structuredClone(fields), id };
      data.projects[index] = updated;
      return structuredClone(updated);
    });
  }

  delete(id: string): Promise<boolean> {
    return this.#store.write((data) => {
      const before = data.projects.length;
      data.projects = data.projects.filter((p) => p.id !== id);
      return data.projects.length < before;
    });
  }
}
