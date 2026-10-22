// Sorting and pagination shared by repositories that work on in-process arrays.

import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type Issue,
  type IssueSortField,
  type Page,
  type Project,
} from '@taskforge/shared';
import type { ListOptions } from './types.ts';

const collator = new Intl.Collator(['he', 'en']);

type Compare<T> = (a: T, b: T) => number;

const issueComparators: Record<IssueSortField, Compare<Issue>> = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
  priority: (a, b) => ISSUE_PRIORITIES.indexOf(a.priority) - ISSUE_PRIORITIES.indexOf(b.priority),
  status: (a, b) => ISSUE_STATUSES.indexOf(a.status) - ISSUE_STATUSES.indexOf(b.status),
  title: (a, b) => collator.compare(a.title, b.title),
};

/** Ties on the sort field fall back to oldest-first, then id, whatever the direction. */
const issueTieBreak: Compare<Issue> = (a, b) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export function compareIssues({ field, dir }: ListOptions<IssueSortField>['sort']): Compare<Issue> {
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => sign * issueComparators[field](a, b) || issueTieBreak(a, b);
}

export function compareProjects({ dir }: ListOptions<'name'>['sort']): Compare<Project> {
  const sign = dir === 'asc' ? 1 : -1;
  return (a, b) => sign * collator.compare(a.name, b.name) || a.id.localeCompare(b.id);
}

export function paginate<T>(sorted: T[], { limit, offset }: ListOptions<string>): Page<T> {
  return { items: sorted.slice(offset, offset + limit), total: sorted.length };
}

export function normalizeName(name: string): string {
  return name.normalize('NFC').toLocaleLowerCase();
}
