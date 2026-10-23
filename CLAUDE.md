# TaskForge

Issue tracker: a REST API (Node 24 + TypeScript (strict, ESM) + Express 5 + zod 4 + Vitest) and a web UI (React 19 + Vite), set up as an npm-workspaces monorepo. `PLAN.md` holds the approved API design (endpoints, error codes, Hebrew support, repository interfaces). `DESIGN.md` holds the UI's visual rules and tokens. Read the relevant one before you build a feature.

## Commands (run from repo root)

| Task                    | Command                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| Install                 | `npm install`                                                    |
| Dev: API + UI together  | `npm run dev` (UI on :5173, API on :3000)                        |
| Dev: API or UI alone    | `npm run dev:api` / `npm run dev:client`                         |
| Seed demo data          | `npm run seed` (`-- --force` replaces existing data)             |
| Build (`tsc -b` + Vite) | `npm run build`                                                  |
| Run built server        | `npm start` (after `npm run build`)                              |
| Test (all packages)     | `npm test`                                                       |
| Test one package        | `npx vitest run --project shared` (`storage` / `api` / `client`) |
| E2E (Playwright)        | `npm run e2e` (first time: `npx playwright install chromium`)    |
| Test watch              | `npm run test:watch`                                             |
| Coverage                | `npm run test:coverage`                                          |
| Typecheck src + tests   | `npm run typecheck`                                              |
| Lint                    | `npm run lint`                                                   |
| Format / check format   | `npm run format` / `npm run format:check`                        |

## Layout

- `server/shared` (`@taskforge/shared`) holds domain types, zod schemas, `ErrorCode`, and i18n (`he`/`en`). It depends only on zod.
- `server/storage` (`@taskforge/storage`) holds the repository interfaces plus the in-memory and JSON-file implementations. Contract test suites are exported from `@taskforge/storage/testing`.
- `server/api` (`@taskforge/api`) is the Express app. `createApp(deps)` lives in `app.ts`, and `server.ts` is the only file that calls `listen()`.
- Dependencies point one way: `api → storage → shared` and `api → shared`. Never import upward.
- Tests go in `server/<pkg>/tests/**/*.test.ts`. They are typechecked through `server/<pkg>/tests/tsconfig.json`.
- `client` (`@taskforge/client`) is the web UI. Vite proxies `/api/*` to the API (strips `/api`), so there is no CORS setup. Env: `CLIENT_PORT`, `TASKFORGE_API_URL`. It imports types, schemas and limits from `@taskforge/shared`, and nothing from `storage` or `api`.
- Client unit tests (pure modules only) go in `client/tests/unit/`. Playwright specs go in `client/e2e/`; they start their own API on a temp data file (port 3210) and Vite (port 5190).
- API env: `PORT` (3000), `HOST` (127.0.0.1), `DATA_FILE` (default `server/api/data/taskforge.json`). The data file format is `{ version: 1, projects, issues, issueCounters }`.

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

## Frontend conventions

- **Data access goes only through `client/src/api/`.** `client.ts` is the one place that calls `fetch`. It turns every failure into an `ApiError` carrying the API's message. Views use the React Query hooks (`projects.ts`, `issues.ts`) and the key factory in `keys.ts`.
- **List view state lives in the URL** (`?status&priority&q&sort&page`) through `useIssueViewState`. Do not mirror it in React state.
- **Styling:** CSS Modules next to each component, and every color, size and timing comes from `client/src/styles/tokens.css`. No inline style objects, no Tailwind, no styled component libraries. Keep one vermilion (`--signal`) action per view. Follow `DESIGN.md`.
- **Behavior comes from approved headless primitives.** Use Radix (dialog, menu, select, tooltip, visually-hidden) and TanStack Table, and do not hand-roll focus traps or menus. The table and toolbar respond with container queries on the `issues` container, not viewport media queries.
- **Keyboard:** register shortcuts with `useHotkeys`, which ignores typing, menus and dialogs. Return `false` from a handler to leave the key to the browser.
- Every async view needs designed loading (a skeleton matching the layout), empty and error (API message + Retry) states. User text renders with `dir="auto"`.

## Definition of done

- **Every new feature ships with tests.** Use unit tests for schemas and services, contract tests for any repository implementation, and supertest integration tests for every endpoint and error path. UI flows get a Playwright spec.
- Before you call a task done, run `npm run typecheck && npm run lint && npm test` and make sure all three pass. For UI changes, also run `npm run e2e`. If something fails, say so with the output. Do not paper over it.

## Never do

- **Do not change the storage file format** (the shape of the JSON data file) without bumping its `version` and adding a migration in `server/storage/src/json-file/migrations.ts`, with tests that load a file in the old format.
- **Do not add, remove, or upgrade dependencies without asking first.** Exact versions are pinned on purpose.
- Do not commit `server/api/data/` contents, `dist/`, `coverage/`, or Playwright's `client/test-results/` / `client/playwright-report/`.
- Do not put backend code outside `server/`, and do not make `shared` depend on another internal package. Do not import `storage` or `api` from `client`.
