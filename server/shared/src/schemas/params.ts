// zod schemas for route params (projectId, issueId).

import { z } from 'zod';

export const projectParamsSchema = z.object({ projectId: z.uuid() });
export type ProjectParams = z.output<typeof projectParamsSchema>;

export const issueParamsSchema = z.object({ projectId: z.uuid(), issueId: z.uuid() });
export type IssueParams = z.output<typeof issueParamsSchema>;
