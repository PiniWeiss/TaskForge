// Typed wrappers for every endpoint the UI uses. Shapes come from @taskforge/shared.

import {
  MAX_LIMIT,
  type Issue,
  type IssuePriority,
  type IssueSortField,
  type IssueStatus,
  type ListResponse,
  type PatchIssueInput,
  type Project,
} from '@taskforge/shared';
import { query, request } from './client.ts';

export interface IssueListParams {
  status?: IssueStatus;
  priority?: IssuePriority;
  q?: string;
  sort: { field: IssueSortField; dir: 'asc' | 'desc' };
  offset: number;
}

export const ISSUE_PAGE_SIZE = MAX_LIMIT;

export function sortParam({ field, dir }: IssueListParams['sort']): string {
  return dir === 'desc' ? `-${field}` : field;
}

export const api = {
  listProjects(signal?: AbortSignal) {
    return request<ListResponse<Project>>(`/projects${query({ limit: MAX_LIMIT })}`, { signal });
  },

  createProject(name: string) {
    return request<Project>('/projects', { method: 'POST', body: { name } });
  },

  renameProject(projectId: string, name: string) {
    return request<Project>(`/projects/${projectId}`, { method: 'PATCH', body: { name } });
  },

  deleteProject(projectId: string) {
    return request<undefined>(`/projects/${projectId}`, { method: 'DELETE' });
  },

  /** Number of issues matching the filter, read from the list total of a one-item page. */
  async countIssues(projectId: string, status?: IssueStatus, signal?: AbortSignal) {
    const page = await request<ListResponse<Issue>>(
      `/projects/${projectId}/issues${query({ limit: 1, status })}`,
      { signal },
    );
    return page.pagination.total;
  },

  listIssues(projectId: string, params: IssueListParams, signal?: AbortSignal) {
    const search = query({
      limit: ISSUE_PAGE_SIZE,
      offset: params.offset,
      sort: sortParam(params.sort),
      status: params.status,
      priority: params.priority,
      q: params.q,
    });
    return request<ListResponse<Issue>>(`/projects/${projectId}/issues${search}`, { signal });
  },

  getIssue(projectId: string, issueId: string, signal?: AbortSignal) {
    return request<Issue>(`/projects/${projectId}/issues/${issueId}`, { signal });
  },

  createIssue(projectId: string, input: { title: string; priority: IssuePriority }) {
    return request<Issue>(`/projects/${projectId}/issues`, { method: 'POST', body: input });
  },

  patchIssue(projectId: string, issueId: string, changes: PatchIssueInput) {
    return request<Issue>(`/projects/${projectId}/issues/${issueId}`, {
      method: 'PATCH',
      body: changes,
    });
  },
};
