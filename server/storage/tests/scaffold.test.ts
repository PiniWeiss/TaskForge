import { describe, expect, it } from 'vitest';

describe('@taskforge/storage scaffold', () => {
  it('resolves the package entry and testing subpath through the workspace', async () => {
    const [main, testing] = await Promise.all([
      import('@taskforge/storage'),
      import('@taskforge/storage/testing'),
    ]);
    expect(main).toBeTypeOf('object');
    expect(testing).toBeTypeOf('object');
  });
});
