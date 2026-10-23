// Storage file format versioning: CURRENT_VERSION and migrate(raw) from older versions.

import type { Issue, Project } from '@taskforge/shared';

export const CURRENT_VERSION = 1;

/** Shape of the JSON data file at CURRENT_VERSION. */
export interface StoreData {
  version: typeof CURRENT_VERSION;
  projects: Project[];
  issues: Issue[];
  /** Last issue number handed out per project id, so numbers are never reused. */
  issueCounters: Record<string, number>;
}

export function emptyStoreData(): StoreData {
  return { version: CURRENT_VERSION, projects: [], issues: [], issueCounters: {} };
}

export class StoreFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreFormatError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Upgrades a parsed data file to CURRENT_VERSION. Add a step here (and a test that loads a file
 * in the old format) whenever the format changes.
 */
export function migrate(raw: unknown): StoreData {
  if (!isRecord(raw)) throw new StoreFormatError('Data file must contain a JSON object');
  const { version } = raw;
  if (version !== CURRENT_VERSION) {
    throw new StoreFormatError(`Unsupported data file version: ${JSON.stringify(version)}`);
  }
  const { projects, issues, issueCounters } = raw;
  if (!Array.isArray(projects) || !Array.isArray(issues) || !isRecord(issueCounters)) {
    throw new StoreFormatError('Data file is missing projects, issues or issueCounters');
  }
  // Records are written only by this package, so their fields are trusted once the shape matches.
  return {
    version,
    projects: projects as Project[],
    issues: issues as Issue[],
    issueCounters: issueCounters as Record<string, number>,
  };
}
