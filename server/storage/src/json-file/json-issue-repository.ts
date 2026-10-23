// IssueRepository backed by JsonFileStore.

import type { Issue, IssueSortField, Page } from '@taskforge/shared';
import { compareIssues, matchesIssueFilter, paginate } from '../list.ts';
import type {
  IssueChanges,
  IssueFilter,
  IssueRepository,
  ListOptions,
  NewIssue,
} from '../types.ts';
import type { JsonFileStore } from './json-file-store.ts';

export class JsonIssueRepository implements IssueRepository {
  readonly #store: JsonFileStore;

  constructor(store: JsonFileStore) {
    this.#store = store;
  }

  findById(id: string): Promise<Issue | null> {
    return this.#store.read((data) => {
      const issue = data.issues.find((i) => i.id === id);
      return issue ? structuredClone(issue) : null;
    });
  }

  listByProject(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>> {
    return this.#store.read((data) => {
      const matches = data.issues
        .filter((issue) => issue.projectId === projectId && matchesIssueFilter(issue, filter))
        .sort(compareIssues(opts.sort));
      return structuredClone(paginate(matches, opts));
    });
  }

  create(issue: NewIssue): Promise<Issue> {
    return this.#store.write((data) => {
      const number = (data.issueCounters[issue.projectId] ?? 0) + 1;
      data.issueCounters[issue.projectId] = number;
      const created: Issue = { ...structuredClone(issue), number };
      data.issues.push(created);
      return structuredClone(created);
    });
  }

  update(id: string, fields: IssueChanges): Promise<Issue | null> {
    return this.#store.write((data) => {
      const index = data.issues.findIndex((i) => i.id === id);
      const existing = data.issues[index];
      if (!existing) return null;
      const updated: Issue = {
        ...structuredClone(fields),
        id,
        projectId: existing.projectId,
        number: existing.number,
        createdAt: existing.createdAt,
      };
      data.issues[index] = updated;
      return structuredClone(updated);
    });
  }

  delete(id: string): Promise<boolean> {
    return this.#store.write((data) => {
      const before = data.issues.length;
      data.issues = data.issues.filter((i) => i.id !== id);
      return data.issues.length < before;
    });
  }

  /** Also drops the project's number counter: the project id is never used again. */
  deleteByProject(projectId: string): Promise<number> {
    return this.#store.write((data) => {
      const before = data.issues.length;
      data.issues = data.issues.filter((i) => i.projectId !== projectId);
      const { [projectId]: _dropped, ...counters } = data.issueCounters;
      data.issueCounters = counters;
      return before - data.issues.length;
    });
  }
}
