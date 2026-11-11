# TaskFlow

Kanban task tracker: React + TypeScript + Redux frontend (`taskflow-web/`, Vite) and Spring Boot API (`taskflow-api/`, Maven, JDK 21). One repo, so a full-stack change is one PR. Also a learning project: `TaskFlow Step-by-Step Build Guide.md` (repo root) defines 11 steps with code patterns and "Done when" checks. Read the relevant step before building it. The guide shows each pattern once; repeating it across other entities is the user's practice, so confirm before bulk-generating that repetition.

Commands live in `package.json` scripts and `pom.xml` (`./mvnw`). PostgreSQL runs via `docker compose up -d`.

## Contract

`taskflow-web/src/types/api.ts` is the source of truth for the API shape. Java DTO records match it field for field (names, enum strings like `IN_PROGRESS`, `LocalDate` as `2026-11-20`, `Instant` as UTC ISO). Change the TS type and the DTO together.

Every failure returns one shape: `ApiError { status, message, fieldErrors? }` (Java `GlobalExceptionHandler`).

## Frontend

- **State has three homes**: server data in RTK Query (`tasksApi`-style `injectEndpoints`), global client state in slices (auth, ui, filters), local UI state in `useState`/`useReducer`.
- **Imports**: `@/` alias; UI from the `@/components/ui` barrel; `import.meta.env` appears only in `src/lib/env.ts` (Jest cannot parse it).
- **Axios client** gets `getToken`/`onUnauthorized` injected through `configureApiClient` in `store.ts`; keep it that way to avoid a client/store import cycle.
- **Store**: build through `setupStore(preloadedState)`; tests make a fresh one per render via `renderWithProviders`.
- **Styling**: SCSS modules; colors, spacing and breakpoints come from CSS custom properties in `_tokens.scss` and mixins in `_mixins.scss`. Components hard-code no color, and both themes (`data-theme`) must work.
- **Accessibility**: every control is keyboard-reachable (drag and drop always has a `Select` fallback); inputs wire `label`/`error` to `aria-describedby`.
- **Stable references**: module-level constants for empty defaults (`NO_TASKS`), `useCallback` for handlers passed to `React.memo` children, `createSelector` with `selectFromResult`.
- **Dev**: Vite proxies `/api` to `localhost:8080`, so development has no CORS setup. `VITE_USE_MOCKS=true` in `.env.development.local` switches on MSW; MSW also backs the tests.
- **Auth token** sits in `localStorage` (simple, XSS-readable); the trade-off belongs in an ADR.

## Backend

- Controllers return DTOs, never entities. `open-in-view: false`, so services load what they need inside the transaction.
- Entity `User` maps to table `app_users` (`user` is reserved in PostgreSQL).
- Security uses Spring's OAuth2 resource server with an HS256 secret from `JWT_SECRET`. Secrets and datasource credentials come from environment variables, never from Git.
- Patch endpoints apply only non-null fields.
- Backend tests run on H2 (`src/test/resources/application.yml`).

## Testing

Jest + React Testing Library (Jest, not Vitest). Query by role, label or text; `findBy` for async; assert on the screen, not Redux state. `jest.config.cjs` mapper order matters: the `@/lib/env` mock precedes the `@/` alias. Coverage gate: 80% lines / 70% branches on `src/features/`.

## Workflow

- Branch per change, conventional commits (`chore: …`, `feat: …`). Husky + lint-staged lint and format on commit; fix the lint error and commit again.
- Measure before and after every performance change (production build, Lighthouse, Profiler); record it in the Step 10 table.
- Framework upgrades go one major version at a time, one commit each, with the upgrade log updated.
- Decisions go in `docs/adr/` (state management, styling, folder structure, token storage).
