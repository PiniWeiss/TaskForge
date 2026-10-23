import type { Issue, IssuePriority, ListResponse, PatchIssueInput } from '@taskforge/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { api, type IssueListParams } from './endpoints.ts';
import { applyChanges, replaceInPage } from './issue-cache.ts';
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

interface PatchVariables {
  issueId: string;
  changes: PatchIssueInput;
}

interface PatchContext {
  previousIssue: Issue | undefined;
  previousLists: [QueryKey, ListResponse<Issue> | undefined][];
}

/**
 * Saves part of an issue optimistically: the panel and every cached list show the change at once,
 * and both roll back if the API rejects it. Lists and counts are refetched afterwards because the
 * change can move the issue in or out of a filter.
 */
export function usePatchIssue(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Issue, Error, PatchVariables, PatchContext>({
    mutationFn: ({ issueId, changes }) => api.patchIssue(projectId, issueId, changes),

    onMutate: async ({ issueId, changes }) => {
      const issueKey = keys.issue(projectId, issueId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: issueKey }),
        queryClient.cancelQueries({ queryKey: keys.issueLists(projectId) }),
      ]);
      const previousIssue = queryClient.getQueryData<Issue>(issueKey);
      const previousLists = queryClient.getQueriesData<ListResponse<Issue>>({
        queryKey: keys.issueLists(projectId),
      });

      queryClient.setQueryData<Issue>(issueKey, (issue) => issue && applyChanges(issue, changes));
      queryClient.setQueriesData<ListResponse<Issue>>(
        { queryKey: keys.issueLists(projectId) },
        (page) => replaceInPage(page, issueId, (issue) => applyChanges(issue, changes)),
      );
      return { previousIssue, previousLists };
    },

    onError: (_error, { issueId }, context) => {
      if (!context) return;
      queryClient.setQueryData(keys.issue(projectId, issueId), context.previousIssue);
      for (const [key, page] of context.previousLists) queryClient.setQueryData(key, page);
    },

    onSuccess: (saved) => {
      queryClient.setQueryData(keys.issue(projectId, saved.id), saved);
      queryClient.setQueriesData<ListResponse<Issue>>(
        { queryKey: keys.issueLists(projectId) },
        (page) => replaceInPage(page, saved.id, () => saved),
      );
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.issueLists(projectId) });
      void queryClient.invalidateQueries({ queryKey: keys.counts(projectId) });
    },
  });
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; priority: IssuePriority }) =>
      api.createIssue(projectId, input),
    onSuccess: (created) => {
      queryClient.setQueryData(keys.issue(projectId, created.id), created);
      void queryClient.invalidateQueries({ queryKey: keys.issueLists(projectId) });
      void queryClient.invalidateQueries({ queryKey: keys.counts(projectId) });
    },
  });
}
