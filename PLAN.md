# TaskForge — Implementation Plan (approved decisions)

Small issue-tracker REST API. Node.js 24 + TypeScript + Express 5 + zod + Vitest, organized as an npm-workspaces monorepo.

## Decisions

| Topic                       | Decision                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Delete project with issues  | Cascade-delete its issues                                                                                                 |
| IDs                         | UUID v4 (`crypto.randomUUID()`)                                                                                           |
| Updates                     | `PATCH` (partial) **and** `PUT` (full replace; omitted optional fields are cleared, defaults re-applied)                  |
| Move issue between projects | Not allowed — `projectId` is immutable                                                                                    |
| Issue defaults              | `status` defaults to `open`; `priority` is **required** (no default); `description` optional                              |
| Issue routes                | Nested under `/projects/:projectId/issues/...` only                                                                       |
| Listing                     | Pagination + sorting on all list endpoints                                                                                |
| Project names               | Unique (case-insensitive, Unicode-normalized) → `409 CONFLICT` on duplicate                                               |
| Module system               | ESM (`"type": "module"`), Node 24, Express 5, zod 4, TS strict                                                            |
| Tooling                     | ESLint (flat config, typescript-eslint) + Prettier, `CLAUDE.md`, git                                                      |
| Hebrew                      | Full Hebrew data support + localized error messages (`he` / `en`)                                                         |
| Repo layout                 | npm-workspaces monorepo, TS project references; all backend code under `server/`, a future UI goes in `client/` beside it |

## Monorepo structure

The root holds only repo-wide tooling. All backend code lives in `server/`; a UI is added later as `client/` next to it, with no changes to `server/`.

```
TaskForge/
├── package.json              # private root, "workspaces": ["server/*"] (later: add "client")
├── tsconfig.base.json        # strict compiler options shared by server and (future) client
├── tsconfig.json             # solution file: project references only
├── vitest.config.ts          # root config using `projects` → runs every package's tests
├── eslint.config.js
├── .prettierrc / .editorconfig (utf-8, lf) / .gitignore / .nvmrc (24)
├── CLAUDE.md / PLAN.md / README.md
├── server/                   # ── everything backend ──
│   ├── shared/               # @taskforge/shared — no runtime deps except zod
│   │   └── src/
│   │       ├── domain.ts     # Project, Issue, IssueStatus, IssuePriority, Page<T>
│   │       ├── schemas/      # zod: project, issue, list query (pagination/sort/filters), params
│   │       ├── errors.ts     # ErrorCode enum + error response type
│   │       └── i18n/         # messages.en.ts, messages.he.ts, translate(), zod error map
│   ├── storage/              # @taskforge/storage — persistence behind interfaces
│   │   └── src/
│   │       ├── types.ts      # ProjectRepository, IssueRepository, ListOptions
│   │       ├── json-file/    # JsonFileStore (atomic write + write queue), Json*Repository
│   │       ├── in-memory/    # InMemory*Repository (tests / dev)
│   │       └── testing/      # repository contract test suites (exported, reused)
│   └── api/                  # @taskforge/api — Express app
│       ├── data/             # runtime JSON storage (gitignored)
│       ├── src/
│       │   ├── server.ts     # entry: config → repos → createApp → listen
│       │   ├── app.ts        # createApp(deps) — dependency injection, no listen()
│       │   ├── config.ts     # PORT, DATA_FILE, DEFAULT_LOCALE
│       │   ├── services/     # project.service.ts, issue.service.ts (rules, ids, clock)
│       │   ├── routes/       # projects.routes.ts, issues.routes.ts (mergeParams)
│       │   ├── middleware/   # validate, locale (Accept-Language), errorHandler, notFound
│       │   └── errors/       # AppError + NotFoundError / ConflictError / ValidationError
│       └── tests/            # unit (services) + integration (supertest)
└── client/                   # (future) UI — add "client" to root workspaces
```

Future expansion fits without restructuring: `client/` can depend on `@taskforge/shared` through the workspace to reuse the same types, zod schemas and Hebrew/English messages as the API. More backend pieces go inside `server/` (e.g. `server/storage-sqlite` implementing the same interfaces and passing the same contract suite, `server/cli`).

Dependency direction: `api → storage → shared`, `api → shared`. `shared` depends on nothing internal.

## Endpoints

```
GET    /projects                          list (paginated, sorted)
POST   /projects                          create
GET    /projects/:projectId
PUT    /projects/:projectId               full replace
PATCH  /projects/:projectId               partial
DELETE /projects/:projectId               cascades issues → 204

GET    /projects/:projectId/issues        list (filters + pagination + sort)
POST   /projects/:projectId/issues
GET    /projects/:projectId/issues/:issueId
PUT    /projects/:projectId/issues/:issueId
PATCH  /projects/:projectId/issues/:issueId
DELETE /projects/:projectId/issues/:issueId   → 204
```

An issue that exists but belongs to a different project returns `404 NOT_FOUND`.

### List query parameters

- Pagination: `?limit=20&offset=0` — default limit 20, max 100.
- Sorting: `?sort=createdAt` / `?sort=-createdAt` (desc). Allowed fields: projects → `name` (default `name`); issues → `createdAt`, `priority`, `status`, `title`. Default issues sort: `-createdAt`. Priority sorts by rank (low < medium < high), not alphabetically. Text sorts use `Intl.Collator(['he', 'en'])`.
- Filters (issues): `?status=open&priority=high`.

Response shape for lists:

```json
{ "data": [ ... ], "pagination": { "total": 42, "limit": 20, "offset": 0 } }
```

Single resources are returned as the plain object. Errors: `{ "error": { "code": "...", "message": "..." } }`.

## Error codes

| code               | HTTP | when                                            |
| ------------------ | ---- | ----------------------------------------------- |
| `VALIDATION_ERROR` | 400  | zod failure (body/params/query), malformed JSON |
| `NOT_FOUND`        | 404  | unknown project/issue, unknown route            |
| `CONFLICT`         | 409  | duplicate project name                          |
| `INTERNAL_ERROR`   | 500  | anything unexpected (no stack leaked)           |

`code` is always the English constant; `message` is localized.

## Hebrew support

1. **Data**: titles, descriptions and names accept any Unicode (Hebrew, nikud, mixed Hebrew/English, emoji). JSON file read/written explicitly as UTF-8; responses `application/json; charset=utf-8`.
2. **Normalization**: input strings are trimmed and normalized to NFC before storage. Project-name uniqueness compares `name.normalize('NFC').toLocaleLowerCase()`.
3. **Length limits** counted in code points (`[...str].length`), not UTF-16 units — name ≤ 100, title ≤ 200, description ≤ 5000.
4. **Localized errors**: `Accept-Language: he` → Hebrew messages; anything else → English. A custom zod error map produces Hebrew validation messages. Message catalogs live in `@taskforge/shared/i18n` so a future UI can reuse them.
5. **Sorting**: locale-aware collation (`Intl.Collator`) so Hebrew titles sort correctly.
6. RTL display is a UI concern — noted for a future `apps/web`.

## Repository interfaces (`@taskforge/storage`)

```ts
interface ListOptions<S extends string> {
  limit: number;
  offset: number;
  sort: { field: S; dir: 'asc' | 'desc' };
}
interface Page<T> {
  items: T[];
  total: number;
}

interface ProjectRepository {
  list(opts: ListOptions<'name'>): Promise<Page<Project>>;
  findById(id: string): Promise<Project | null>;
  findByNormalizedName(name: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  update(id: string, data: Omit<Project, 'id'>): Promise<Project | null>; // service merges for PATCH
  delete(id: string): Promise<boolean>;
}

interface IssueFilter {
  status?: IssueStatus;
  priority?: IssuePriority;
}

interface IssueRepository {
  findById(id: string): Promise<Issue | null>;
  listByProject(
    projectId: string,
    filter: IssueFilter,
    opts: ListOptions<IssueSortField>,
  ): Promise<Page<Issue>>;
  create(issue: Issue): Promise<Issue>;
  update(id: string, data: Omit<Issue, 'id' | 'projectId' | 'createdAt'>): Promise<Issue | null>;
  delete(id: string): Promise<boolean>;
  deleteByProject(projectId: string): Promise<number>;
}
```

- Async everywhere so a DB implementation can drop in.
- Services build full entities (id, createdAt via injected `idGen` / `clock`); repos only store.
- Filtering, sorting and pagination happen in the repo so a SQL implementation can push them into queries.
- JSON store: single file `{ version: 1, projects: [], issues: [] }`, loaded once and cached, every write is atomic (write `.tmp` → rename) and serialized through a promise queue; missing file is created. On load, `json-file/migrations.ts` upgrades older `version`s to the current one.
- Cascade delete happens in the project service (issues first, then project).

## Testing strategy (Vitest)

1. **shared** — schema unit tests (valid/invalid, defaults, enums, trimming, NFC, code-point lengths, Hebrew strings), i18n translate + zod error map.
2. **storage** — contract suites in `src/testing/` run against both InMemory and JsonFile repos (JsonFile in a temp dir): CRUD, filters, sort (incl. Hebrew collation, priority rank), pagination, persistence across instances, concurrent writes, Hebrew round-trip.
3. **api/unit** — services with in-memory repos + fake clock/idGen: cascade, unique names (`שם` vs `שם` with different normalization), PUT vs PATCH semantics, projectId immutability.
4. **api/integration** — supertest on `createApp()`: every endpoint, filter/sort/pagination combos, every error path with exact `{ error: { code, message } }` shape, `Accept-Language: he` messages, wrong-project issue → 404.
5. Coverage via `@vitest/coverage-v8`, target ≥ 90% on shared/storage/services.

Root scripts: `dev`, `build` (`tsc -b`), `test`, `test:coverage`, `lint`, `format`, `typecheck`.

## Build order

1. Root scaffolding: workspaces, tsconfigs, ESLint/Prettier, Vitest, git init, `CLAUDE.md`.
2. `server/shared` (`@taskforge/shared`): domain types, schemas, errors, i18n (+ tests).
3. `server/storage` (`@taskforge/storage`): interfaces, in-memory, contract suite, JSON file store (+ tests).
4. `server/api` (`@taskforge/api`): errors, middleware, services, routes, app, server (+ unit & integration tests).
5. README with run instructions and example requests (including Hebrew).
