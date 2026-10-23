// zod schemas for project create / replace / patch bodies.

import { z } from 'zod';
import { TEXT_LIMITS, optionalText, requiredText } from './text.ts';

/** POST body. Strict, so `id` / timestamps cannot be set by clients. */
export const createProjectSchema = z.strictObject({
  name: requiredText(TEXT_LIMITS.name),
  description: optionalText(TEXT_LIMITS.description),
});
export type CreateProjectInput = z.output<typeof createProjectSchema>;

/** PUT body: same rules as create; an omitted description is cleared. */
export const replaceProjectSchema = createProjectSchema;
export type ReplaceProjectInput = z.output<typeof replaceProjectSchema>;

/** PATCH body: any subset of fields, at least one. */
export const patchProjectSchema = z
  .strictObject({
    name: requiredText(TEXT_LIMITS.name).optional(),
    description: optionalText(TEXT_LIMITS.description),
  })
  .refine((body) => Object.keys(body).length > 0, {
    params: { key: 'validation.atLeastOneField' },
    when: (payload) => payload.issues.length === 0,
  });
export type PatchProjectInput = z.output<typeof patchProjectSchema>;
