import type { Issue, ListResponse } from '@taskforge/shared';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type IssueListParams } from './endpoints.ts';
import { keys } from './keys.ts';

export function useIssues(projectId: string, params: IssueListParams) {
  return useQuery({
    queryKey: keys.issueList(projectId, params),
    queryFn: ({ signal }) => api.listIssues(projectId, params, signal),
    // Keep showing the previous rows while a new filter or sort loads, instead of a blank table.
    placeholderData: keepPreviousData,
  });
}

export function useIssue(projectId: string, issueId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: keys.issue(projectId, issueId),
    queryFn: ({ signal }) => api.getIssue(projectId, issueId, signal),
    // Seed from any cached list page so opening a row is instant; it still refetches in the
    // background because the seed is marked as old.
    initialData: () =>
      queryClient
        .getQueriesData<ListResponse<Issue>>({ queryKey: keys.issueLists(projectId) })
        .flatMap(([, page]) => page?.data ?? [])
        .find((issue) => issue.id === issueId),
    initialDataUpdatedAt: 0,
  });
}
