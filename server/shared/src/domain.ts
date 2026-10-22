// Domain types: Project, Issue, IssueStatus, IssuePriority, Page<T>.

/** Workflow order; also the sort rank for `?sort=status`. */
export const ISSUE_STATUSES = ['open', 'in_progress', 'closed'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/** Ascending rank; also the sort rank for `?sort=priority`. */
export const ISSUE_PRIORITIES = ['low', 'medium', 'high'] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  /** Per-project sequence (1, 2, 3, …) assigned on create; never changes and is never reused. */
  number: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  createdAt: string;
  updatedAt: string;
}

/** A slice of a list plus the total number of matches before pagination. */
export interface Page<T> {
  items: T[];
  total: number;
}

/** Wire format of every list endpoint. */
export interface ListResponse<T> {
  data: T[];
  pagination: { total: number; limit: number; offset: number };
}
