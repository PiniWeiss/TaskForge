// React Query keys. Hierarchical, so invalidating a prefix refreshes everything beneath it.

import type { IssueStatus } from '@taskforge/shared';
import type { IssueListParams } from './endpoints.ts';

export const keys = {
  projects: () => ['projects'] as const,
  /** Everything issue-related for one project: lists, single issues and counts. */
  project: (projectId: string) => ['project', projectId] as const,
  issueLists: (projectId: string) => ['project', projectId, 'issues'] as const,
  issueList: (projectId: string, params: IssueListParams) =>
    ['project', projectId, 'issues', params] as const,
  issue: (projectId: string, issueId: string) => ['project', projectId, 'issue', issueId] as const,
  counts: (projectId: string) => ['project', projectId, 'count'] as const,
  count: (projectId: string, status?: IssueStatus) =>
    ['project', projectId, 'count', status ?? 'all'] as const,
};
