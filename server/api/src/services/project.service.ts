// Project business rules: unique names, PUT vs PATCH, cascade delete.

import type {
  CreateProjectInput,
  Page,
  PatchProjectInput,
  Project,
  ProjectSortField,
  ReplaceProjectInput,
} from '@taskforge/shared';
import type { IssueRepository, ListOptions, ProjectRepository } from '@taskforge/storage';
import { ConflictError, NotFoundError } from '../errors/index.ts';

export interface ProjectServiceDeps {
  projects: ProjectRepository;
  issues: IssueRepository;
  idGen: () => string;
  clock: () => Date;
}

export class ProjectService {
  readonly #deps: ProjectServiceDeps;

  constructor(deps: ProjectServiceDeps) {
    this.#deps = deps;
  }

  list(opts: ListOptions<ProjectSortField>): Promise<Page<Project>> {
    return this.#deps.projects.list(opts);
  }

  async get(projectId: string): Promise<Project> {
    const project = await this.#deps.projects.findById(projectId);
    if (!project) throw NotFoundError.project(projectId);
    return project;
  }

  async create(input: CreateProjectInput): Promise<Project> {
    await this.#requireUniqueName(input.name);
    const now = this.#deps.clock().toISOString();
    return this.#deps.projects.create({
      id: this.#deps.idGen(),
      ...input,
      createdAt: now,
      updatedAt: now,
    });
  }

  async patch(projectId: string, input: PatchProjectInput): Promise<Project> {
    const { id: _id, ...current } = await this.get(projectId);
    return this.#save(projectId, { ...current, ...input });
  }

  async replace(projectId: string, input: ReplaceProjectInput): Promise<Project> {
    const { createdAt } = await this.get(projectId);
    return this.#save(projectId, { ...input, createdAt });
  }

  /** Deletes the project's issues first, so a failure never leaves orphans behind. */
  async delete(projectId: string): Promise<void> {
    await this.get(projectId);
    await this.#deps.issues.deleteByProject(projectId);
    if (!(await this.#deps.projects.delete(projectId))) throw NotFoundError.project(projectId);
  }

  async #save(projectId: string, fields: Omit<Project, 'id' | 'updatedAt'>): Promise<Project> {
    await this.#requireUniqueName(fields.name, projectId);
    const updated = await this.#deps.projects.update(projectId, {
      ...fields,
      updatedAt: this.#deps.clock().toISOString(),
    });
    if (!updated) throw NotFoundError.project(projectId);
    return updated;
  }

  /** Names are unique case-insensitively after NFC normalization; a project may keep its own. */
  async #requireUniqueName(name: string, ownId?: string): Promise<void> {
    const existing = await this.#deps.projects.findByNormalizedName(name);
    if (existing && existing.id !== ownId) {
      throw new ConflictError('error.conflict.projectName', { name: existing.name });
    }
  }
}
