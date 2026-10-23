// Test data helpers. Every test creates its own uniquely named project, so tests never share state.

import { test as base, expect, type APIRequestContext } from '@playwright/test';
import type { Issue, IssuePriority, IssueStatus, Project } from '@taskforge/shared';

let counter = 0;

export function uniqueName(prefix: string): string {
  counter++;
  return `${prefix} ${String(Date.now() % 100_000)}-${String(counter)}`;
}

export async function createProject(request: APIRequestContext, name = uniqueName('Project')) {
  const res = await request.post('/api/projects', { data: { name } });
  expect(res.status()).toBe(201);
  return (await res.json()) as Project;
}

export async function createIssue(
  request: APIRequestContext,
  projectId: string,
  issue: { title: string; priority: IssuePriority; status?: IssueStatus },
) {
  const res = await request.post(`/api/projects/${projectId}/issues`, { data: issue });
  expect(res.status()).toBe(201);
  return (await res.json()) as Issue;
}

interface Fixtures {
  /** A fresh project with three issues filed in this order. */
  seeded: { project: Project; issues: Issue[] };
}

export const test = base.extend<Fixtures>({
  seeded: async ({ request }, use) => {
    const project = await createProject(request, uniqueName('Payments'));
    const issues = [
      await createIssue(request, project.id, {
        title: 'Refund webhook retries forever on 409',
        priority: 'high',
      }),
      await createIssue(request, project.id, {
        title: 'Export CSV drops the currency column',
        priority: 'medium',
        status: 'in_progress',
      }),
      await createIssue(request, project.id, {
        title: 'Tax ID field accepts trailing whitespace',
        priority: 'low',
        status: 'closed',
      }),
    ];
    await use({ project, issues });
  },
});

export { expect };
