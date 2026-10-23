// Issue business rules: defaults, projectId immutability, project ownership checks.

import type {
  CreateIssueInput,
  Issue,
  IssueSortField,
  Page,
  PatchIssueInput,
  ReplaceIssueInput,
} from '@taskforge/shared';
import type {
  IssueFilter,
  IssueRepository,
  ListOptions,
  ProjectRepository,
} from '@taskforge/storage';
import { NotFoundError } from '../errors/index.ts';

export interface IssueServiceDeps {
  projects: ProjectRepository;
  issues: IssueRepository;
  idGen: () => string;
  clock: () => Date;
}

export class IssueService {
  readonly #deps: IssueServiceDeps;

  constructor(deps: IssueServiceDeps) {
    this.#deps = deps;
  }

  async create(projectId: string, input: CreateIssueInput): Promise<Issue> {
    await this.#requireProject(projectId);
    const now = this.#deps.clock().toISOString();
    return this.#deps.issues.create({
      id: this.#deps.idGen(),
      projectId,
      ...input,
      createdAt: now,
      updatedAt: now,
    });
  }

  async get(projectId: string, issueId: string): Promise<Issue> {
    await this.#requireProject(projectId);
    const issue = await this.#deps.issues.findById(issueId);
    // An issue of another project is reported as missing, not forbidden.
    if (issue?.projectId !== projectId) throw NotFoundError.issue(issueId);
    return issue;
  }

  async list(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>> {
    await this.#requireProject(projectId);
    return this.#deps.issues.listByProject(projectId, filter, opts);
  }

  async patch(projectId: string, issueId: string, input: PatchIssueInput): Promise<Issue> {
    const {
      id: _id,
      projectId: _projectId,
      number: _number,
      createdAt: _createdAt,
      ...current
    } = await this.get(projectId, issueId);
    return this.#save(issueId, { ...current, ...input });
  }

  async replace(projectId: string, issueId: string, input: ReplaceIssueInput): Promise<Issue> {
    await this.get(projectId, issueId);
    return this.#save(issueId, input);
  }

  async delete(projectId: string, issueId: string): Promise<void> {
    await this.get(projectId, issueId);
    if (!(await this.#deps.issues.delete(issueId))) throw NotFoundError.issue(issueId);
  }

  async #save(issueId: string, fields: ReplaceIssueInput): Promise<Issue> {
    const updated = await this.#deps.issues.update(issueId, {
      ...fields,
      updatedAt: this.#deps.clock().toISOString(),
    });
    if (!updated) throw NotFoundError.issue(issueId);
    return updated;
  }

  async #requireProject(projectId: string): Promise<void> {
    if (!(await this.#deps.projects.findById(projectId))) throw NotFoundError.project(projectId);
  }
}
