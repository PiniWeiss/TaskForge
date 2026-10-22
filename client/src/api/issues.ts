import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
