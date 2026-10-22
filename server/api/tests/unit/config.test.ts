import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DATA_FILE, loadConfig } from '../../src/config.ts';

describe('loadConfig', () => {
  it('applies defaults', () => {
    expect(loadConfig({})).toEqual({
      port: 3000,
      host: '127.0.0.1',
      dataFile: DEFAULT_DATA_FILE,
    });
    expect(DEFAULT_DATA_FILE.replaceAll('\\', '/')).toMatch(/server\/api\/data\/taskforge\.json$/);
  });

  it('reads PORT, HOST and DATA_FILE', () => {
    expect(loadConfig({ PORT: '4100', HOST: '0.0.0.0', DATA_FILE: 'tmp/x.json' })).toEqual({
      port: 4100,
      host: '0.0.0.0',
      dataFile: resolve('tmp/x.json'),
    });
  });

  it('rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: 'eighty' })).toThrow(/Invalid environment: PORT/);
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/);
  });
});
