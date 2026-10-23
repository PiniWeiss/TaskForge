// Pure helpers for editing cached issue data, used by optimistic updates.

import type { Issue, ListResponse, PatchIssueInput } from '@taskforge/shared';

/** The issue as it will look once `changes` are saved (timestamps aside). */
export function applyChanges(issue: Issue, changes: PatchIssueInput): Issue {
  const next: Issue = { ...issue };
  if (changes.title !== undefined) next.title = changes.title;
  if (changes.status !== undefined) next.status = changes.status;
  if (changes.priority !== undefined) next.priority = changes.priority;
  if (changes.description !== undefined) next.description = changes.description;
  return next;
}

/** Replaces one issue inside a cached list page; other pages come back untouched (same object). */
export function replaceInPage(
  page: ListResponse<Issue> | undefined,
  issueId: string,
  replace: (issue: Issue) => Issue,
): ListResponse<Issue> | undefined {
  if (!page?.data.some((issue) => issue.id === issueId)) return page;
  return {
    ...page,
    data: page.data.map((issue) => (issue.id === issueId ? replace(issue) : issue)),
  };
}
