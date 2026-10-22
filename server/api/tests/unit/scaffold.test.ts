import { describe, expect, it } from 'vitest';

describe('@taskforge/api scaffold', () => {
  it('loads the app module', async () => {
    const mod = await import('../../src/app.ts');
    expect(mod).toBeTypeOf('object');
  });
});
