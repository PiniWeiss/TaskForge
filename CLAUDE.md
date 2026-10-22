# TaskForge

Issue-tracker REST API: Node 24 + TypeScript (strict, ESM) + Express 5 + zod 4 + Vitest, set up as an npm-workspaces monorepo. `PLAN.md` holds the approved design (endpoints, error codes, Hebrew support, repository interfaces). Read it before you build a feature.

## Commands (run from repo root)

| Task                         | Command                                               |
| ---------------------------- | ----------------------------------------------------- |
| Install                      | `npm install`                                         |
| Dev server (watch, no build) | `npm run dev`                                         |
| Build (`tsc -b`)             | `npm run build`                                       |
| Run built server             | `npm start` (after `npm run build`)                   |
| Test (all packages)          | `npm test`                                            |
| Test one package             | `npx vitest run --project shared` (`storage` / `api`) |
| Test watch                   | `npm run test:watch`                                  |
| Coverage                     | `npm run test:coverage`                               |
| Typecheck src + tests        | `npm run typecheck`                                   |
| Lint                         | `npm run lint`                                        |
| Format / check format        | `npm run format` / `npm run format:check`             |

## Layout

- `server/shared` (`@taskforge/shared`) holds domain types, zod schemas, `ErrorCode`, and i18n (`he`/`en`). It depends only on zod.
- `server/storage` (`@taskforge/storage`) holds the repository interfaces plus the in-memory and JSON-file implementations. Contract test suites are exported from `@taskforge/storage/testing`.
- `server/api` (`@taskforge/api`) is the Express app. `createApp(deps)` lives in `app.ts`, and `server.ts` is the only file that calls `listen()`.
- Dependencies point one way: `api → storage → shared` and `api → shared`. Never import upward.
- Tests go in `server/<pkg>/tests/**/*.test.ts`. They are typechecked through `server/<pkg>/tests/tsconfig.json`.
- A future UI goes in `client/`. Add it to the root `workspaces`.

## Code conventions

- **Strict TypeScript.** All strict flags in `tsconfig.base.json` stay on. Do not use `@ts-ignore`, and do not use non-null `!` to silence the compiler.
- **No `any`.** Use `unknown` and narrow it, or use a zod schema. ESLint enforces this.
- **Named exports only.** Do not use `export default`. Tool config files are the only exception.
- **No `enum`, namespaces, or parameter properties** (`erasableSyntaxOnly`). Node runs `.ts` natively in dev. Write `const X = { ... } as const` plus `type X = (typeof X)[keyof typeof X]` instead of an enum.
- **Relative imports use the `.ts` extension** (`import { x } from './x.ts'`). `tsc` rewrites them to `.js` on build. Other packages are imported by name (`@taskforge/shared`), never by relative path.
- Use `import type` for type-only imports.
- **Errors go through the central error handler.** Services throw `AppError` subclasses (`NotFoundError`, `ConflictError`, `ValidationError`) from `server/api/src/errors`. Express 5 forwards both thrown errors and rejected promises to `server/api/src/middleware/error-handler.ts`. That handler is the only place that builds the `{ error: { code, message } }` response and picks the localized message. Do not build error responses in routes or services. Do not leak stack traces.
- User-facing messages come from the i18n catalogs in `@taskforge/shared`. Add every new key to both `messages.en.ts` and `messages.he.ts`.
- Keep services free of Express types. Inject `idGen` and `clock`. Do not call `crypto.randomUUID()` or `new Date()` directly in a service.

## Definition of done

- **Every new feature ships with tests.** Use unit tests for schemas and services, contract tests for any repository implementation, and supertest integration tests for every endpoint and error path.
- Before you call a task done, run `npm run typecheck && npm run lint && npm test` and make sure all three pass. If something fails, say so with the output. Do not paper over it.

## Never do

- **Do not change the storage file format** (the shape of the JSON data file) without bumping its `version` and adding a migration in `server/storage/src/json-file/migrations.ts`, with tests that load a file in the old format.
- **Do not add, remove, or upgrade dependencies without asking first.** Exact versions are pinned on purpose.
- Do not commit `server/api/data/` contents, `dist/`, or `coverage/`.
- Do not put backend code outside `server/`, and do not make `shared` depend on another internal package.
