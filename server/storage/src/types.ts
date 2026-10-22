// ProjectRepository, IssueRepository, IssueFilter, ListOptions.

import type {
  Issue,
  IssuePriority,
  IssueSortField,
  IssueStatus,
  Page,
  Project,
  Sort,
} from '@taskforge/shared';

export type { IssueSortField, Page };

export interface ListOptions<S extends string> {
  limit: number;
  offset: number;
  sort: Sort<S>;
}

export interface ProjectRepository {
  list(opts: ListOptions<'name'>): Promise<Page<Project>>;
  findById(id: string): Promise<Project | null>;
  /** Matches `name.normalize('NFC').toLocaleLowerCase()`. */
  findByNormalizedName(name: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  /** Replaces everything but `id`; the service merges for PATCH. */
  update(id: string, data: Omit<Project, 'id'>): Promise<Project | null>;
  delete(id: string): Promise<boolean>;
}

export interface IssueFilter {
  status?: IssueStatus;
  priority?: IssuePriority;
}

export interface IssueRepository {
  findById(id: string): Promise<Issue | null>;
  listByProject(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>>;
  create(issue: Issue): Promise<Issue>;
  /** Replaces everything but `id`, `projectId` and `createdAt`. */
  update(id: string, data: Omit<Issue, 'id' | 'projectId' | 'createdAt'>): Promise<Issue | null>;
  delete(id: string): Promise<boolean>;
  deleteByProject(projectId: string): Promise<number>;
}
