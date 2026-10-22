// In-memory IssueRepository (tests / dev).

import type { Issue, IssueSortField, Page } from '@taskforge/shared';
import { compareIssues, paginate } from '../list.ts';
import type { IssueFilter, IssueRepository, ListOptions } from '../types.ts';

export class InMemoryIssueRepository implements IssueRepository {
  readonly #issues = new Map<string, Issue>();

  findById(id: string): Promise<Issue | null> {
    const issue = this.#issues.get(id);
    return Promise.resolve(issue ? structuredClone(issue) : null);
  }

  listByProject(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>> {
    const matches = [...this.#issues.values()]
      .filter(
        (issue) =>
          issue.projectId === projectId &&
          (filter.status === undefined || issue.status === filter.status) &&
          (filter.priority === undefined || issue.priority === filter.priority),
      )
      .sort(compareIssues(opts.sort));
    const page = paginate(matches, opts);
    return Promise.resolve({ ...page, items: page.items.map((issue) => structuredClone(issue)) });
  }

  create(issue: Issue): Promise<Issue> {
    this.#issues.set(issue.id, structuredClone(issue));
    return Promise.resolve(structuredClone(issue));
  }

  update(id: string, data: Omit<Issue, 'id' | 'projectId' | 'createdAt'>): Promise<Issue | null> {
    const existing = this.#issues.get(id);
    if (!existing) return Promise.resolve(null);
    const updated: Issue = {
      ...structuredClone(data),
      id,
      projectId: existing.projectId,
      createdAt: existing.createdAt,
    };
    this.#issues.set(id, updated);
    return Promise.resolve(structuredClone(updated));
  }

  delete(id: string): Promise<boolean> {
    return Promise.resolve(this.#issues.delete(id));
  }

  deleteByProject(projectId: string): Promise<number> {
    let count = 0;
    for (const [id, issue] of this.#issues) {
      if (issue.projectId === projectId) {
        this.#issues.delete(id);
        count++;
      }
    }
    return Promise.resolve(count);
  }
}
