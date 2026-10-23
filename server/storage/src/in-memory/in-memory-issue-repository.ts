// In-memory IssueRepository (tests / dev).

import type { Issue, IssueSortField, Page } from '@taskforge/shared';
import { compareIssues, matchesIssueFilter, paginate } from '../list.ts';
import type {
  IssueChanges,
  IssueFilter,
  IssueRepository,
  ListOptions,
  NewIssue,
} from '../types.ts';

export class InMemoryIssueRepository implements IssueRepository {
  readonly #issues = new Map<string, Issue>();
  /** Last number handed out per project; survives deletes so numbers are never reused. */
  readonly #lastNumbers = new Map<string, number>();

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
      .filter((issue) => issue.projectId === projectId && matchesIssueFilter(issue, filter))
      .sort(compareIssues(opts.sort));
    const page = paginate(matches, opts);
    return Promise.resolve({ ...page, items: page.items.map((issue) => structuredClone(issue)) });
  }

  create(issue: NewIssue): Promise<Issue> {
    const number = (this.#lastNumbers.get(issue.projectId) ?? 0) + 1;
    this.#lastNumbers.set(issue.projectId, number);
    const created: Issue = { ...structuredClone(issue), number };
    this.#issues.set(created.id, created);
    return Promise.resolve(structuredClone(created));
  }

  update(id: string, data: IssueChanges): Promise<Issue | null> {
    const existing = this.#issues.get(id);
    if (!existing) return Promise.resolve(null);
    const updated: Issue = {
      ...structuredClone(data),
      id,
      projectId: existing.projectId,
      number: existing.number,
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
