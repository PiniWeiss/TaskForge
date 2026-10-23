// /projects/:projectId/issues router (mergeParams).

import {
  createIssueSchema,
  issueParamsSchema,
  listIssuesQuerySchema,
  patchIssueSchema,
  projectParamsSchema,
  replaceIssueSchema,
  type Issue,
  type ListResponse,
} from '@taskforge/shared';
import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import type { IssueService } from '../services/issue.service.ts';

export function createIssuesRouter(service: IssueService): Router {
  const router = Router({ mergeParams: true });

  router.get(
    '/',
    validate(
      { params: projectParamsSchema, query: listIssuesQuerySchema },
      async ({ params, query }, _req, res) => {
        const { limit, offset, sort, status, priority, q } = query;
        const page = await service.list(
          params.projectId,
          { status, priority, q },
          { limit, offset, sort },
        );
        const body: ListResponse<Issue> = {
          data: page.items,
          pagination: { total: page.total, limit, offset },
        };
        res.json(body);
      },
    ),
  );

  router.post(
    '/',
    validate(
      { params: projectParamsSchema, body: createIssueSchema },
      async ({ params, body }, _req, res) => {
        res.status(201).json(await service.create(params.projectId, body));
      },
    ),
  );

  router.get(
    '/:issueId',
    validate({ params: issueParamsSchema }, async ({ params }, _req, res) => {
      res.json(await service.get(params.projectId, params.issueId));
    }),
  );

  router.put(
    '/:issueId',
    validate(
      { params: issueParamsSchema, body: replaceIssueSchema },
      async ({ params, body }, _req, res) => {
        res.json(await service.replace(params.projectId, params.issueId, body));
      },
    ),
  );

  router.patch(
    '/:issueId',
    validate(
      { params: issueParamsSchema, body: patchIssueSchema },
      async ({ params, body }, _req, res) => {
        res.json(await service.patch(params.projectId, params.issueId, body));
      },
    ),
  );

  router.delete(
    '/:issueId',
    validate({ params: issueParamsSchema }, async ({ params }, _req, res) => {
      await service.delete(params.projectId, params.issueId);
      res.status(204).end();
    }),
  );

  return router;
}
