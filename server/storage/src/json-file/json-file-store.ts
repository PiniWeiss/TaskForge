// JsonFileStore: cached UTF-8 JSON file, atomic writes (.tmp → rename), serialized write queue.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { emptyStoreData, migrate, type StoreData } from './migrations.ts';

/** Windows (and sync clients such as OneDrive) may briefly lock the target during a rename. */
const RETRYABLE_RENAME_CODES = new Set(['EPERM', 'EBUSY', 'EACCES']);
const RENAME_ATTEMPTS = 5;

function errorCode(err: unknown): unknown {
  return typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined;
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (err) {
      if (attempt >= RENAME_ATTEMPTS || !RETRYABLE_RENAME_CODES.has(String(errorCode(err)))) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
    }
  }
}

/**
 * Holds the whole data file in memory. Reads wait for queued writes, so callers always see their
 * own changes. Each write runs alone, builds the next state on a copy and only replaces the cache
 * once the file is safely on disk, so a failed write leaves both untouched.
 */
export class JsonFileStore {
  readonly #path: string;
  #data: StoreData | null = null;
  #tail: Promise<unknown> = Promise.resolve();

  constructor(path: string) {
    this.#path = path;
  }

  get path(): string {
    return this.#path;
  }

  /** Runs `read` against the current data. Do not mutate the argument or keep references to it. */
  read<T>(read: (data: Readonly<StoreData>) => T): Promise<T> {
    return this.#enqueue(async () => read(await this.#load()));
  }

  /** Applies `change` to a copy of the data, persists it and returns `change`'s result. */
  write<T>(change: (draft: StoreData) => T): Promise<T> {
    return this.#enqueue(async () => {
      const draft = structuredClone(await this.#load());
      const result = change(draft);
      await this.#persist(draft);
      this.#data = draft;
      return result;
    });
  }

  #enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.#tail.then(task);
    this.#tail = run.catch(() => undefined);
    return run;
  }

  async #load(): Promise<StoreData> {
    if (this.#data) return this.#data;
    let text: string;
    try {
      text = await readFile(this.#path, 'utf8');
    } catch (err) {
      if (errorCode(err) !== 'ENOENT') throw err;
      const fresh = emptyStoreData();
      await this.#persist(fresh);
      this.#data = fresh;
      return fresh;
    }
    this.#data = migrate(JSON.parse(text));
    return this.#data;
  }

  async #persist(data: StoreData): Promise<void> {
    await mkdir(dirname(this.#path), { recursive: true });
    const tmp = `${this.#path}.tmp`;
    await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await renameWithRetry(tmp, this.#path);
  }
}
