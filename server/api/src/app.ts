// createApp(deps): builds the Express app with injected repositories, idGen and clock. Never calls listen().

import type { IssueRepository, ProjectRepository } from '@taskforge/storage';
import express, { type Express } from 'express';
import { errorHandler } from './middleware/error-handler.ts';
import { resolveLocale } from './middleware/locale.ts';
import { notFound } from './middleware/not-found.ts';
import { createIssuesRouter } from './routes/issues.routes.ts';
import { createProjectsRouter } from './routes/projects.routes.ts';
import { IssueService } from './services/issue.service.ts';
import { ProjectService } from './services/project.service.ts';

export interface AppDeps {
  projects: ProjectRepository;
  issues: IssueRepository;
  idGen: () => string;
  clock: () => Date;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(resolveLocale);
  app.use(express.json());

  app.use('/projects', createProjectsRouter(new ProjectService(deps)));
  app.use('/projects/:projectId/issues', createIssuesRouter(new IssueService(deps)));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
