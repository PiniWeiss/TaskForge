// zod schemas for list query params: pagination, sort, issue filters.

import { z } from 'zod';
import { issuePrioritySchema, issueStatusSchema } from './issue.ts';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type SortDirection = 'asc' | 'desc';
export interface Sort<F extends string> {
  field: F;
  dir: SortDirection;
}

export const paginationShape = {
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
};

/** `?sort=field` (ascending) or `?sort=-field` (descending), restricted to `fields`. */
export function sortParam<const F extends string>(fields: readonly F[], defaultSort: F | `-${F}`) {
  const values = fields.flatMap((field) => [field, `-${field}` as const]);
  return z
    .enum(values)
    .optional()
    .transform((value): Sort<F> => {
      const raw: string = value ?? defaultSort;
      const desc = raw.startsWith('-');
      return { field: (desc ? raw.slice(1) : raw) as F, dir: desc ? 'desc' : 'asc' };
    });
}

/** Query filters match enum values case-insensitively (`?status=OPEN` == `?status=open`). */
function caseInsensitive<T extends z.ZodType<unknown, string>>(schema: T) {
  return z.string().toLowerCase().pipe(schema);
}

export const ISSUE_SORT_FIELDS = ['createdAt', 'priority', 'status', 'title'] as const;
export type IssueSortField = (typeof ISSUE_SORT_FIELDS)[number];

export const listIssuesQuerySchema = z.object({
  ...paginationShape,
  sort: sortParam(ISSUE_SORT_FIELDS, '-createdAt'),
  status: caseInsensitive(issueStatusSchema).optional(),
  priority: caseInsensitive(issuePrioritySchema).optional(),
});
export type ListIssuesQuery = z.output<typeof listIssuesQuerySchema>;
