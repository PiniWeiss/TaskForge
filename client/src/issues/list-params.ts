// The issue list view lives in the URL (?status=open&priority=high&q=refund&sort=-priority&page=2),
// so any view can be shared or refreshed. Parsing never throws: a bad value falls back to the default.

import {
  ISSUE_PRIORITIES,
  ISSUE_SORT_FIELDS,
  ISSUE_STATUSES,
  type IssuePriority,
  type IssueSortField,
  type IssueStatus,
} from '@taskforge/shared';
import { ISSUE_PAGE_SIZE, type IssueListParams } from '../api/endpoints.ts';

export interface IssueViewState {
  status?: IssueStatus;
  priority?: IssuePriority;
  q: string;
  sort: { field: IssueSortField; dir: 'asc' | 'desc' };
  /** 1-based. */
  page: number;
}

export const DEFAULT_SORT: IssueViewState['sort'] = { field: 'createdAt', dir: 'desc' };

function oneOf<T extends string>(values: readonly T[], raw: string | null): T | undefined {
  const value = raw?.toLowerCase();
  return values.find((v) => v === value);
}

function parseSort(raw: string | null): IssueViewState['sort'] {
  if (!raw) return DEFAULT_SORT;
  const desc = raw.startsWith('-');
  const field = oneOf(ISSUE_SORT_FIELDS, desc ? raw.slice(1) : raw);
  return field ? { field, dir: desc ? 'desc' : 'asc' } : DEFAULT_SORT;
}

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

export function parseViewState(search: URLSearchParams): IssueViewState {
  return {
    status: oneOf(ISSUE_STATUSES, search.get('status')),
    priority: oneOf(ISSUE_PRIORITIES, search.get('priority')),
    q: search.get('q')?.trim() ?? '',
    sort: parseSort(search.get('sort')),
    page: parsePage(search.get('page')),
  };
}

/** Writes only non-default values, so the plain project URL stays clean. */
export function serializeViewState(state: IssueViewState): URLSearchParams {
  const search = new URLSearchParams();
  if (state.status) search.set('status', state.status);
  if (state.priority) search.set('priority', state.priority);
  if (state.q.trim()) search.set('q', state.q.trim());
  if (state.sort.field !== DEFAULT_SORT.field || state.sort.dir !== DEFAULT_SORT.dir) {
    search.set('sort', state.sort.dir === 'desc' ? `-${state.sort.field}` : state.sort.field);
  }
  if (state.page > 1) search.set('page', String(state.page));
  return search;
}

export function hasFilters(state: IssueViewState): boolean {
  return state.status !== undefined || state.priority !== undefined || state.q !== '';
}

export function toListParams(state: IssueViewState): IssueListParams {
  return {
    status: state.status,
    priority: state.priority,
    q: state.q || undefined,
    sort: state.sort,
    offset: (state.page - 1) * ISSUE_PAGE_SIZE,
  };
}
