import type { Express } from 'express';
import type { Project } from '@taskforge/shared';
import { InMemoryIssueRepository, InMemoryProjectRepository } from '@taskforge/storage';
import { createApp } from '../src/app.ts';

/** Deterministic UUID v4-shaped ids: …-000000000001, …-000000000002, … */
export function fakeIdGen(): () => string {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
}

/** Clock that advances one minute on every call. */
export function fakeClock(start = '2026-01-01T00:00:00.000Z'): () => Date {
  let t = Date.parse(start);
  return () => {
    const now = new Date(t);
    t += 60_000;
    return now;
  };
}

export interface TestContext {
  app: Express;
  projects: InMemoryProjectRepository;
  issues: InMemoryIssueRepository;
  seedProject(name: string): Promise<Project>;
}

export function createTestContext(): TestContext {
  const projects = new InMemoryProjectRepository();
  const issues = new InMemoryIssueRepository();
  const idGen = fakeIdGen();
  const clock = fakeClock();
  const app = createApp({ projects, issues, idGen, clock });

  return {
    app,
    projects,
    issues,
    seedProject(name) {
      const now = clock().toISOString();
      return projects.create({ id: idGen(), name, createdAt: now, updatedAt: now });
    },
  };
}
