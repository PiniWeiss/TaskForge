import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

// Resolve workspace packages (@taskforge/*) to their TypeScript sources, not dist/.
// Do not list 'import' / 'default': Vite and Node add them per import kind, and Vitest passes
// ssr.resolve.conditions to the worker as `node --conditions`, where a forced 'import' makes CJS
// deps `require()` ESM entries (express → router → is-promise breaks async error handling).
const sourceConditions = ['@taskforge/source', 'node'];

function serverPackage(name: string): TestProjectInlineConfiguration {
  return {
    extends: false,
    resolve: { conditions: sourceConditions },
    ssr: { resolve: { conditions: sourceConditions, externalConditions: ['@taskforge/source'] } },
    test: {
      name,
      root: `./server/${name}`,
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
}

/** Client unit tests cover pure modules (API client, URL state, formatting); flows are Playwright's job. */
const clientPackage: TestProjectInlineConfiguration = {
  extends: false,
  resolve: { conditions: sourceConditions },
  ssr: { resolve: { conditions: sourceConditions, externalConditions: ['@taskforge/source'] } },
  test: {
    name: 'client',
    root: './client',
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
};

export default defineConfig({
  test: {
    projects: [
      serverPackage('shared'),
      serverPackage('storage'),
      serverPackage('api'),
      clientPackage,
    ],
    coverage: {
      provider: 'v8',
      include: ['server/*/src/**/*.ts'],
      exclude: ['server/storage/src/testing/**', 'server/api/src/server.ts'],
      reporter: ['text', 'html'],
    },
  },
});
