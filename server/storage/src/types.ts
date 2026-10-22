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
  /** Case-insensitive substring of the title, or an issue number written as `12` / `#12`. */
  q?: string;
}

/** An issue as the service builds it; the repository assigns `number`. */
export type NewIssue = Omit<Issue, 'number'>;

/** Everything an update may change. */
export type IssueChanges = Omit<Issue, 'id' | 'projectId' | 'number' | 'createdAt'>;

export interface IssueRepository {
  findById(id: string): Promise<Issue | null>;
  listByProject(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>>;
  /** Stores the issue under the next number of its project. Numbers are never reused, even after a delete. */
  create(issue: NewIssue): Promise<Issue>;
  /** Replaces everything but `id`, `projectId`, `number` and `createdAt`. */
  update(id: string, data: IssueChanges): Promise<Issue | null>;
  delete(id: string): Promise<boolean>;
  deleteByProject(projectId: string): Promise<number>;
}
