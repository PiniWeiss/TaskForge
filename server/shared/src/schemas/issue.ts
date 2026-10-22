// zod schemas for issue create / replace / patch bodies.

import { z } from 'zod';
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '../domain.ts';
import { TEXT_LIMITS, optionalText, requiredText } from './text.ts';

export const issueStatusSchema = z.enum(ISSUE_STATUSES);
export const issuePrioritySchema = z.enum(ISSUE_PRIORITIES);

/** POST body. Strict, so `projectId` / `id` / timestamps cannot be set by clients. */
export const createIssueSchema = z.strictObject({
  title: requiredText(TEXT_LIMITS.title),
  description: optionalText(TEXT_LIMITS.description),
  status: issueStatusSchema.default('open'),
  priority: issuePrioritySchema,
});
export type CreateIssueInput = z.output<typeof createIssueSchema>;

/** PUT body: same rules as create; omitted optional fields are cleared, defaults re-applied. */
export const replaceIssueSchema = createIssueSchema;
export type ReplaceIssueInput = z.output<typeof replaceIssueSchema>;

/** PATCH body: any subset of fields, at least one. */
export const patchIssueSchema = z
  .strictObject({
    title: requiredText(TEXT_LIMITS.title).optional(),
    description: optionalText(TEXT_LIMITS.description),
    status: issueStatusSchema.optional(),
    priority: issuePrioritySchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    params: { key: 'validation.atLeastOneField' },
    // Skip when the body already failed (e.g. only unknown keys) to avoid a misleading second message.
    when: (payload) => payload.issues.length === 0,
  });
export type PatchIssueInput = z.output<typeof patchIssueSchema>;
