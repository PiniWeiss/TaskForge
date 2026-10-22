// /projects router.

import {
  createProjectSchema,
  listProjectsQuerySchema,
  patchProjectSchema,
  projectParamsSchema,
  replaceProjectSchema,
  type ListResponse,
  type Project,
} from '@taskforge/shared';
import { Router } from 'express';
import { validate } from '../middleware/validate.ts';
import type { ProjectService } from '../services/project.service.ts';

export function createProjectsRouter(service: ProjectService): Router {
  const router = Router();

  router.get(
    '/',
    validate({ query: listProjectsQuerySchema }, async ({ query }, _req, res) => {
      const page = await service.list(query);
      const body: ListResponse<Project> = {
        data: page.items,
        pagination: { total: page.total, limit: query.limit, offset: query.offset },
      };
      res.json(body);
    }),
  );

  router.post(
    '/',
    validate({ body: createProjectSchema }, async ({ body }, _req, res) => {
      res.status(201).json(await service.create(body));
    }),
  );

  router.get(
    '/:projectId',
    validate({ params: projectParamsSchema }, async ({ params }, _req, res) => {
      res.json(await service.get(params.projectId));
    }),
  );

  router.put(
    '/:projectId',
    validate(
      { params: projectParamsSchema, body: replaceProjectSchema },
      async ({ params, body }, _req, res) => {
        res.json(await service.replace(params.projectId, body));
      },
    ),
  );

  router.patch(
    '/:projectId',
    validate(
      { params: projectParamsSchema, body: patchProjectSchema },
      async ({ params, body }, _req, res) => {
        res.json(await service.patch(params.projectId, body));
      },
    ),
  );

  router.delete(
    '/:projectId',
    validate({ params: projectParamsSchema }, async ({ params }, _req, res) => {
      await service.delete(params.projectId);
      res.status(204).end();
    }),
  );

  return router;
}
