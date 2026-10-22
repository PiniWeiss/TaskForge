import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

// Resolve workspace packages (@taskforge/*) to their TypeScript sources, not dist/.
const sourceConditions = ['@taskforge/source', 'node', 'import', 'default'];

function serverPackage(name: string): TestProjectInlineConfiguration {
  return {
    extends: false,
    resolve: { conditions: sourceConditions },
    ssr: { resolve: { conditions: sourceConditions, externalConditions: sourceConditions } },
    test: {
      name,
      root: `./server/${name}`,
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
}

export default defineConfig({
  test: {
    projects: [serverPackage('shared'), serverPackage('storage'), serverPackage('api')],
    coverage: {
      provider: 'v8',
      include: ['server/*/src/**/*.ts'],
      exclude: ['server/storage/src/testing/**', 'server/api/src/server.ts'],
      reporter: ['text', 'html'],
    },
  },
});
