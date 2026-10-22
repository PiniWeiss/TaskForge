// Fills a store with the demo data. Used by scripts/seed (CLI) and its test.

import type { IssueRepository, ProjectRepository } from '@taskforge/storage';
import { SEED_PROJECTS, type SeedProject } from './seed-data.ts';

export interface SeedDeps {
  projects: ProjectRepository;
  issues: IssueRepository;
  idGen: () => string;
  clock: () => Date;
}

const HOUR_MS = 3_600_000;

/** Creates every seed project and its issues, oldest first, so issue numbers follow filing order. */
export async function seed(deps: SeedDeps, data: SeedProject[] = SEED_PROJECTS) {
  const now = deps.clock().getTime();
  const at = (hoursAgo: number) => new Date(now - hoursAgo * HOUR_MS).toISOString();
  let issueCount = 0;

  for (const project of data) {
    const oldest = Math.max(...project.issues.map((i) => i.ageHours));
    const created = await deps.projects.create({
      id: deps.idGen(),
      name: project.name,
      description: project.description,
      createdAt: at(oldest + 24),
      updatedAt: at(oldest + 24),
    });

    const chronological = [...project.issues].sort((a, b) => b.ageHours - a.ageHours);
    for (const issue of chronological) {
      const touchedAgo = Math.max(0, issue.ageHours - (issue.touchedAfterHours ?? 0));
      await deps.issues.create({
        id: deps.idGen(),
        projectId: created.id,
        title: issue.title,
        ...(issue.description === undefined ? {} : { description: issue.description }),
        status: issue.status,
        priority: issue.priority,
        createdAt: at(issue.ageHours),
        updatedAt: at(touchedAgo),
      });
      issueCount++;
    }
  }

  return { projects: data.length, issues: issueCount };
}
