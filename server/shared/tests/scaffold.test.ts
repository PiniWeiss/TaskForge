import { describe, expect, it } from 'vitest';

describe('@taskforge/shared scaffold', () => {
  it('resolves the package entry through the workspace', async () => {
    const mod = await import('@taskforge/shared');
    expect(mod).toBeTypeOf('object');
  });
});
