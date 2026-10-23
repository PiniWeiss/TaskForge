// Runtime config from env: PORT, HOST, DATA_FILE.

import { resolve } from 'node:path';
import { z } from 'zod';

/** `server/api/data/taskforge.json`, wherever the process is started from. */
export const DEFAULT_DATA_FILE = resolve(import.meta.dirname, '../data/taskforge.json');

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  HOST: z.string().min(1).default('127.0.0.1'),
  DATA_FILE: z.string().min(1).optional(),
});

export interface Config {
  port: number;
  host: string;
  dataFile: string;
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment: ${details.join('; ')}`);
  }
  const { PORT, HOST, DATA_FILE } = parsed.data;
  return { port: PORT, host: HOST, dataFile: DATA_FILE ? resolve(DATA_FILE) : DEFAULT_DATA_FILE };
}
