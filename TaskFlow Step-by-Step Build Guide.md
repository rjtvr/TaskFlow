# TaskFlow: Step-by-Step Build Guide

Nov 4, 2026 · @Rajat

## Overview

Follow these 11 steps in order to build TaskFlow end to end: a React + TypeScript + Redux frontend and a Spring Boot API. Steps 1–6 run on mocks, Step 7 builds the backend, and Steps 8–11 connect, test, tune and ship. It pairs with the six-week practice plan: Steps 1–2 are Week 1, 4–5 Week 2, 3 and 6 Week 3, 7–8 Week 4, 9–10 Week 5, and 11 Week 6.

Each step has a goal, the commands, the key code, and a "Done when" check. The code shows the pattern; extend it to the other entities yourself, since that repetition is the practice.

### Prerequisites

- Node.js LTS (20 or newer) and npm
- JDK 21, plus IntelliJ IDEA or VS Code with Java extensions
- Docker Desktop (for PostgreSQL)
- Git and a GitHub account
- Browser extensions: React Developer Tools and Redux DevTools

### Repository layout

Use one repository with two apps, so a full-stack change is one pull request.

```text
taskflow/
  taskflow-web/        React app (Vite)
  taskflow-api/        Spring Boot app (Maven)
  docker-compose.yml   PostgreSQL
  .github/workflows/   CI
  docs/adr/            Architecture decision records
```

## Step 1: Create the repo and scaffold the frontend

Goal: a strict TypeScript project with linting, formatting and commit hooks before any feature code.

1. Create the repo and the frontend:

```bash
mkdir taskflow && cd taskflow && git init
npm create vite@latest taskflow-web -- --template react-ts
cd taskflow-web
npm install
npm install @reduxjs/toolkit react-redux react-router-dom axios
npm install -D sass prettier eslint-config-prettier husky lint-staged
```

2. Turn on strictness in `tsconfig.app.json` (the Vite template already sets `strict`; add these):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

3. Add the matching alias in `vite.config.ts`, plus a dev proxy so the browser calls `/api` and never hits CORS during development:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { proxy: { '/api': 'http://localhost:8080' } },
});
```

4. Set up Husky and lint-staged so every commit is linted and formatted:

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

Then in `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{scss,json,md}": ["prettier --write"]
}
```

5. Create the feature-based folders: `app/`, `components/ui/`, `features/`, `hooks/`, `lib/`, `mocks/`, `styles/`, `types/`.
6. Commit on a branch and open your first pull request: `git checkout -b chore/scaffold`, then `git commit -m "chore: scaffold vite react-ts app"`.

Done when: `npm run dev` serves the app, `npm run lint` passes, and a commit with a lint error is blocked by the hook.

## Step 2: Design tokens and the UI kit

Goal: every color, space and breakpoint comes from one place, and every component is typed, accessible and themeable.

1. Define tokens as CSS custom properties so the theme can switch at runtime. `src/styles/_tokens.scss`:

```scss
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f6f8;
  --color-text: #1b1f24;
  --color-primary: #2f6fed;
  --color-danger: #d64545;
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --radius: 8px;
  --font-body: system-ui, sans-serif;
}

[data-theme='dark'] {
  --color-bg: #121417;
  --color-surface: #1d2025;
  --color-text: #e8eaed;
  --color-primary: #6b9bff;
}
```

2. Put breakpoints and shared patterns in mixins. `src/styles/_mixins.scss`:

```scss
$breakpoints: (sm: 576px, md: 768px, lg: 1024px, xl: 1280px);

@mixin up($bp) {
  @media (min-width: map-get($breakpoints, $bp)) { @content; }
}

@mixin focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

3. Import `_tokens.scss` once in `src/styles/global.scss`, and import that in `main.tsx`.
4. Build the Button. `src/components/ui/Button/Button.tsx`:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled,
     className, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
```

And its `Button.module.scss`:

```scss
@use '@/styles/mixins' as m;

.button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 0;
  border-radius: var(--radius);
  cursor: pointer;
  &:focus-visible { @include m.focus-ring; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.primary { background: var(--color-primary); color: #fff; }
.danger  { background: var(--color-danger);  color: #fff; }
.sm { padding: var(--space-1) var(--space-2); }
.md { padding: var(--space-2) var(--space-4); }
```

5. Build the Modal with a portal, Escape to close, and focus restore. `src/components/ui/Modal/Modal.tsx`:

```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true"
           aria-labelledby={titleId} tabIndex={-1}
           className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
```

6. Build the rest of the kit with the same pattern: Input (with `label` and `error` props wired to `aria-describedby`), Select, Checkbox, Card, Badge, Spinner, EmptyState, and Tabs as a compound component (`<Tabs><Tabs.List/><Tabs.Panel/></Tabs>` sharing state through context).
7. Export everything from `src/components/ui/index.ts` so features import from one place.
8. Add a `/kit` route that renders every component in every state, with a theme toggle that sets `document.documentElement.dataset.theme`.

Exercise: add a focus trap to the Modal so Tab cycles inside it, then compare your version with the native `<dialog>` element and `showModal()`.

Done when: the kit page looks right in both themes, every control is reachable by keyboard, and no component hard-codes a color.

## Step 3: App shell, responsive layout and routing

Goal: a layout that works from 375px to desktop, with lazy-loaded routes and a guard for logged-in pages.

1. Build `AppLayout` with a header, a sidebar and an `<Outlet />`. Use CSS grid: one column on mobile (sidebar becomes a slide-in drawer), two columns from `md` up.

```scss
@use '@/styles/mixins' as m;

.layout {
  display: grid;
  grid-template-rows: 56px 1fr;
  min-height: 100dvh;
  @include m.up(md) {
    grid-template-columns: 240px 1fr;
    grid-template-areas: 'header header' 'sidebar main';
  }
}
```

2. Define routes with lazy pages. `src/app/router.tsx`:

```tsx
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteError } from './RouteError';
import { Spinner } from '@/components/ui';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const BoardPage = lazy(() => import('@/features/tasks/BoardPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));

const page = (el: ReactNode) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

export const router = createBrowserRouter([
  { path: '/login', element: page(<LoginPage />) },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [{
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/projects" replace /> },
        { path: 'projects', element: page(<ProjectsPage />) },
        { path: 'projects/:projectId/board', element: page(<BoardPage />) },
        { path: 'dashboard', element: page(<DashboardPage />) },
      ],
    }],
  },
]);
```

3. Add the guard. It reads the auth slice you build in Step 5, so stub `isAuthenticated = true` until then. `src/app/ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />;
}
```

4. Render `<RouterProvider router={router} />` in `main.tsx`.
5. Add a class-based `ErrorBoundary` component (only classes can implement `getDerivedStateFromError` and `componentDidCatch`) and wrap each page's content with it, so one broken widget does not blank the app.
6. Use URL search params for list state that should survive a refresh or be shareable, such as `?status=IN_PROGRESS&q=login`.

Done when: each page loads as its own chunk (check the Network tab), the sidebar collapses on mobile, and an error thrown in one page shows the fallback instead of a white screen.

## Step 4: API contract and MSW mocks

Goal: agree the API shape first, then mock it so the frontend never waits for the backend. The Spring Boot DTOs in Step 7 must match these types exactly.

1. Write the endpoints down:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Returns `{ token, user }` |
| GET | `/api/projects?q=&page=&size=&sort=` | Paged, searchable project list |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{id}/tasks?status=` | Tasks for a board |
| POST | `/api/projects/{id}/tasks` | Create a task |
| PATCH | `/api/tasks/{id}` | Partial update (status, title, assignee) |
| DELETE | `/api/tasks/{id}` | Delete a task |
| GET, POST | `/api/tasks/{id}/comments` | Read and add comments |

2. Mirror them as types. `src/types/api.ts`:

```ts
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User { id: number; name: string; email: string; }
export interface Project { id: number; key: string; name: string; description?: string; }

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: number;
  dueDate?: string;     // ISO date, e.g. 2026-11-20
  createdAt: string;    // ISO instant
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: string; user: User; }
```

3. Install MSW and generate its service worker:

```bash
npm install -D msw @faker-js/faker
npx msw init public/ --save
```

4. Seed an in-memory `db` in `src/mocks/db.ts` (5 projects, 60 tasks, 3 users) with faker, then write handlers. `src/mocks/handlers.ts`:

```ts
import { http, HttpResponse, delay } from 'msw';
import type { LoginRequest, Page, Project, Task } from '@/types/api';
import { db } from './db';

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email } = (await request.json()) as LoginRequest;
    return HttpResponse.json({ token: 'dev-token', user: { id: 1, name: 'Dev', email } });
  }),

  http.get('/api/projects', async ({ request }) => {
    await delay(300); // makes loading states visible
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 10);
    const all = db.projects.filter((p) => p.name.toLowerCase().includes(q));
    const body: Page<Project> = {
      content: all.slice(page * size, page * size + size),
      page, size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
    };
    return HttpResponse.json(body);
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const patch = (await request.json()) as Partial<Task>;
    const task = db.tasks.find((t) => t.id === Number(params.id));
    if (!task) {
      return HttpResponse.json({ status: 404, message: 'Task not found' }, { status: 404 });
    }
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(task);
  }),
  // ...the remaining endpoints follow the same pattern
];
```

5. Start the worker in development only. `src/mocks/browser.ts` exports `setupWorker(...handlers)` from `msw/browser`; `src/mocks/server.ts` exports `setupServer(...handlers)` from `msw/node` for tests. In `main.tsx`:

```tsx
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
```

6. Add `VITE_USE_MOCKS=true` to `.env.development.local`.

Exercise: add a query param like `?fail=1` that makes a handler return 500, so you can see every error state on demand.

Done when: `GET /api/projects` in the Network tab shows a mocked response, and the types file compiles with no `any`.

## Step 5: API client, Redux store and RTK Query

Goal: one HTTP client, one typed store, and a clear home for every kind of state: server data in RTK Query, global client state in slices, local UI state in `useState`.

1. Keep `import.meta.env` in one file so Jest can mock it later. `src/lib/env.ts`:

```ts
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
};
```

2. Build the Axios client. It gets the token and the logout action injected, which avoids a circular import between the client and the store. `src/lib/apiClient.ts`:

```ts
import axios, { type AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { env } from '@/lib/env'; // alias path, so Jest can map it to a mock

export const apiClient = axios.create({ baseURL: env.apiUrl, timeout: 10_000 });

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureApiClient(opts: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) onUnauthorized();
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message,
      fieldErrors: error.response?.data?.fieldErrors,
    };
    return Promise.reject(apiError);
  },
);
```

3. Write the auth slice with a hand-written thunk, so you can explain pending, fulfilled and rejected without RTK Query's help. `src/features/auth/authSlice.ts`:

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/apiClient';
import type { ApiError, LoginRequest, LoginResponse, User } from '@/types/api';
import type { RootState } from '@/app/store';

interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const saved = JSON.parse(localStorage.getItem('auth') ?? 'null');
const initialState: AuthState = {
  token: saved?.token ?? null,
  user: saved?.user ?? null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk<LoginResponse, LoginRequest, { rejectValue: ApiError }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err as ApiError);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? 'Login failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
export const selectIsAuthenticated = (state: RootState) => state.auth.token !== null;
export const selectCurrentUser = (state: RootState) => state.auth.user;
```

4. Add `uiSlice` (theme, sidebar open, toasts queue) and `filtersSlice` (search text, status, assignee) the same way, with plain reducers only.
5. Create the RTK Query base on top of the Axios client. `src/app/api.ts`:

```ts
import { createApi, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/apiClient';
import type { ApiError } from '@/types/api';

type Args = { url: string; method?: AxiosRequestConfig['method']; data?: unknown; params?: unknown };

const axiosBaseQuery = (): BaseQueryFn<Args, unknown, ApiError> =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await apiClient({ url, method, data, params });
      return { data: result.data };
    } catch (err) {
      return { error: err as ApiError };
    }
  };

export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Project', 'Task'],
  endpoints: () => ({}),
});
```

6. Inject feature endpoints, including an optimistic status update with rollback. `src/features/tasks/tasksApi.ts`:

```ts
import { api } from '@/app/api';
import type { Task } from '@/types/api';

export const tasksApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => ({ url: `/api/projects/${projectId}/tasks` }),
      providesTags: (result) => [
        ...(result ?? []).map((t) => ({ type: 'Task' as const, id: t.id })),
        { type: 'Task' as const, id: 'LIST' },
      ],
    }),
    createTask: build.mutation<Task, { projectId: number; body: Partial<Task> }>({
      query: ({ projectId, body }) => ({
        url: `/api/projects/${projectId}/tasks`, method: 'POST', data: body,
      }),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: build.mutation<Task, { id: number; projectId: number; patch: Partial<Task> }>({
      query: ({ id, patch }) => ({ url: `/api/tasks/${id}`, method: 'PATCH', data: patch }),
      async onQueryStarted({ id, projectId, patch }, { dispatch, queryFulfilled }) {
        const optimistic = dispatch(
          tasksApi.util.updateQueryData('getTasks', { projectId }, (draft) => {
            const task = draft.find((t) => t.id === id);
            if (task) Object.assign(task, patch);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          optimistic.undo(); // roll back the card if the server says no
        }
      },
    }),
  }),
});

export const { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } = tasksApi;
```

7. Build the store as a factory, so tests can create a fresh one with preloaded state. `src/app/store.ts`:

```ts
import { combineReducers, configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import authReducer, { login, logout } from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import filtersReducer from '@/features/filters/filtersSlice';
import { api } from './api';
import { configureApiClient } from '@/lib/apiClient';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  filters: filtersReducer,
  [api.reducerPath]: api.reducer,
});
export type RootState = ReturnType<typeof rootReducer>;

const listener = createListenerMiddleware();
listener.startListening({
  matcher: isAnyOf(login.fulfilled, logout),
  effect: (_action, { getState }) => {
    const { token, user } = (getState() as RootState).auth;
    localStorage.setItem('auth', JSON.stringify(token ? { token, user } : null));
  },
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) =>
      getDefault().prepend(listener.middleware).concat(api.middleware),
  });
}

export const store = setupStore();
configureApiClient({
  getToken: () => store.getState().auth.token,
  onUnauthorized: () => store.dispatch(logout()),
});

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
```

8. Typed hooks. `src/app/hooks.ts`:

```ts
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

9. Wrap the app in `<Provider store={store}>` and remove the `isAuthenticated` stub from Step 3.

Design note for your ADR: storing the JWT in `localStorage` is simple but readable by any script on the page. An httpOnly cookie is safer against XSS but needs CSRF protection. Write down which you chose and why.

Done when: Redux DevTools shows `auth/login/pending` then `fulfilled`, and dragging a card updates instantly and snaps back when you force the mock to return 500.

## Step 6: Build the features

Goal: the real screens, with each hook chosen for a reason you can state.

### 6.1 Custom hooks

Write these first in `src/hooks/`, since every feature uses them.

```ts
// useDebounce.ts: delay a fast-changing value (search input)
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // cleanup cancels the previous timer
  }, [value, delay]);
  return debounced;
}

// useMediaQuery.ts: subscribe to an external source the React 18+ way
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
```

Also write `useClickOutside(ref, handler)`, `useLocalStorage(key, initial)` and `usePrevious(value)`.

### 6.2 Login page

1. Controlled email and password inputs from the UI kit.
2. On submit, `dispatch(login(values))` and use `.unwrap()` to catch the error in the component.
3. On success, navigate to `location.state?.from` or `/projects`.
4. Show `state.auth.error` under the form and disable the button while `status === 'loading'`.

### 6.3 Projects page: search and pagination

```tsx
export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const q = useDebounce(search, 300);
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetProjectsQuery({ q, page, size: 10 });

  if (isLoading) return <Spinner />;
  if (isError) {
    return <EmptyState title="Could not load projects" message={error?.message}
                       action={<Button onClick={refetch}>Retry</Button>} />;
  }

  return (
    <>
      <Input label="Search projects" value={search}
             onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      {data?.content.length === 0 && <EmptyState title="No projects match" />}
      <ul aria-busy={isFetching}>
        {data?.content.map((p) => <ProjectRow key={p.id} project={p} />)}
      </ul>
      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  );
}
```

RTK Query drops stale responses for you, so typing fast never shows old results. Exercise: rebuild this once with plain `useEffect` + `fetch` + `AbortController` to feel the race condition RTK Query is hiding.

### 6.4 Kanban board

```tsx
const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const NO_TASKS: Task[] = []; // stable reference; `= []` inline would break useMemo

export default function BoardPage() {
  const projectId = Number(useParams().projectId);
  const { data: tasks = NO_TASKS, isLoading } = useGetTasksQuery({ projectId });
  const [updateTask] = useUpdateTaskMutation();

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    for (const t of tasks) groups[t.status].push(t);
    return groups;
  }, [tasks]);

  const moveTask = useCallback(
    (id: number, status: TaskStatus) => updateTask({ id, projectId, patch: { status } }),
    [updateTask, projectId],
  );

  if (isLoading) return <Spinner />;
  return (
    <div className={styles.board}>
      {COLUMNS.map((status) => (
        <BoardColumn key={status} status={status}
                     tasks={byStatus[status]} onDropTask={moveTask} />
      ))}
    </div>
  );
}
```

`BoardColumn` is wrapped in `React.memo`, so only the columns whose task array changed re-render. That only works because `moveTask` is stable (`useCallback`) and `byStatus` is memoized.

```tsx
export const BoardColumn = memo(function BoardColumn({ status, tasks, onDropTask }: Props) {
  return (
    <section aria-label={status} className={styles.column}
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => onDropTask(Number(e.dataTransfer.getData('text/plain')), status)}>
      {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
    </section>
  );
});
```

In `TaskCard`, set `draggable` and `onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.id))}`. Drag and drop is not keyboard accessible, so also add a status `Select` on each card. Swap to dnd-kit later if you want reordering within a column.

### 6.5 Task form with `useReducer`

Use a reducer because the form has several fields, validation and a dirty flag that change together:

```ts
type Values = { title: string; description: string; priority: Priority; dueDate: string };
type State = { values: Values; errors: Partial<Record<keyof Values, string>>; dirty: boolean };
type Action =
  | { type: 'change'; field: keyof Values; value: string }
  | { type: 'setErrors'; errors: State['errors'] }
  | { type: 'reset'; values: Values };

function formReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'change':
      return { ...state, dirty: true,
               values: { ...state.values, [action.field]: action.value },
               errors: { ...state.errors, [action.field]: undefined } };
    case 'setErrors':
      return { ...state, errors: action.errors };
    case 'reset':
      return { values: action.values, errors: {}, dirty: false };
  }
}
```

Validate on submit (title required, max 120 characters; due date not in the past). When the server returns `fieldErrors`, dispatch them with `setErrors` so backend validation shows under the right input. Open the form in the Modal from Step 2.

### 6.6 Dashboard with a memoized selector

```ts
const selectStats = createSelector([(tasks: Task[] | undefined) => tasks], (tasks = []) => ({
  total: tasks.length,
  byStatus: Object.fromEntries(
    COLUMNS.map((s) => [s, tasks.filter((t) => t.status === s).length]),
  ) as Record<TaskStatus, number>,
}));

const { stats } = useGetTasksQuery({ projectId }, {
  selectFromResult: ({ data }) => ({ stats: selectStats(data) }),
});
```

Without `createSelector`, `selectFromResult` returns a new object every time and the dashboard re-renders on every store change. Lazy-load the chart library inside the dashboard route.

### 6.7 Lifecycle drill

Write the task activity panel as a class component first, then convert it to hooks and keep this mapping in your notes:

| Class component | Hooks equivalent |
| --- | --- |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate(prevProps)` | `useEffect(fn, [deps])`, plus `usePrevious` when you need the old value |
| `componentWillUnmount` | The cleanup function returned from `useEffect` |
| `shouldComponentUpdate` | `React.memo`, `useMemo`, `useCallback` |
| `getDerivedStateFromProps` | Compute during render, or reset with a `key` |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` with a `useRef` |
| `componentDidCatch` | No hook: keep a class `ErrorBoundary` |

Done when: you can log in, search projects, drag a task across columns, create a task with validation errors, and see dashboard counts change, all on mocks.

## Step 7: Spring Boot backend

Goal: a layered REST API (controller, service, repository) whose JSON matches `src/types/api.ts` exactly, secured with JWT.

### 7.1 Generate the project and database

1. On [start.spring.io](https://start.spring.io) choose Maven, Java 21, and these dependencies: Spring Web, Spring Data JPA, Validation, Spring Security, OAuth2 Resource Server, PostgreSQL Driver, H2 Database. Name it `taskflow-api` and unzip it into the repo.
2. Add `org.springdoc:springdoc-openapi-starter-webmvc-ui` to `pom.xml`, using the version the springdoc docs list for your Spring Boot version.
3. Add PostgreSQL. `docker-compose.yml` at the repo root:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow
    ports:
      - "5432:5432"
```

4. Configure `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskflow
    username: taskflow
    password: taskflow
  jpa:
    hibernate:
      ddl-auto: update      # switch to Flyway migrations once the schema settles
    open-in-view: false     # forces you to load what you need inside services
app:
  jwt-secret: ${JWT_SECRET:dev-only-secret-at-least-32-bytes-long!!}
```

### 7.2 Entities

Create `User` (mapped to table `app_users`, since `user` is reserved in PostgreSQL), `Project`, `Task` and `Comment`. The Task entity:

```java
@Entity
@Table(name = "tasks")
public class Task {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Project project;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @ManyToOne(fetch = FetchType.LAZY)
    private User assignee;

    private LocalDate dueDate;

    @CreationTimestamp private Instant createdAt;
    @UpdateTimestamp private Instant updatedAt;

    // getters and setters
}
```

Use `Instant` for timestamps so they serialize as UTC ISO strings, matching the TypeScript `string` fields.

### 7.3 DTOs, repositories and a page wrapper

Never return entities from controllers: DTOs keep the JSON stable and avoid lazy-loading surprises.

```java
public record TaskDto(Long id, Long projectId, String title, String description,
                      TaskStatus status, Priority priority, Long assigneeId,
                      LocalDate dueDate, Instant createdAt, Instant updatedAt) {
    public static TaskDto from(Task t) {
        return new TaskDto(t.getId(), t.getProject().getId(), t.getTitle(), t.getDescription(),
                t.getStatus(), t.getPriority(),
                t.getAssignee() == null ? null : t.getAssignee().getId(),
                t.getDueDate(), t.getCreatedAt(), t.getUpdatedAt());
    }
}

public record CreateTaskRequest(@NotBlank @Size(max = 120) String title,
                                @Size(max = 4000) String description,
                                @NotNull Priority priority,
                                Long assigneeId,
                                @FutureOrPresent LocalDate dueDate) {}

public record UpdateTaskRequest(@Size(min = 1, max = 120) String title,
                                TaskStatus status, Priority priority,
                                Long assigneeId, LocalDate dueDate) {}

public record PageResponse<T>(List<T> content, int page, int size,
                              long totalElements, int totalPages) {
    public static <T> PageResponse<T> of(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(),
                p.getTotalElements(), p.getTotalPages());
    }
}

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByIdAsc(Long projectId);
}

public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
```

### 7.4 Service and controller

```java
@Service
@Transactional
public class TaskService {
    private final TaskRepository tasks;
    private final ProjectRepository projects;

    public TaskService(TaskRepository tasks, ProjectRepository projects) {
        this.tasks = tasks;
        this.projects = projects;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> list(Long projectId) {
        return tasks.findByProjectIdOrderByIdAsc(projectId).stream().map(TaskDto::from).toList();
    }

    public TaskDto update(Long id, UpdateTaskRequest req) {
        Task task = tasks.findById(id)
                .orElseThrow(() -> new NotFoundException("Task " + id + " not found"));
        if (req.title() != null) task.setTitle(req.title());
        if (req.status() != null) task.setStatus(req.status());
        if (req.priority() != null) task.setPriority(req.priority());
        if (req.dueDate() != null) task.setDueDate(req.dueDate());
        return TaskDto.from(task); // dirty checking writes the change on commit
    }
    // create(...) and delete(...) follow the same shape
}

@RestController
@RequestMapping("/api")
public class TaskController {
    private final TaskService service;

    public TaskController(TaskService service) { this.service = service; }

    @GetMapping("/projects/{projectId}/tasks")
    public List<TaskDto> list(@PathVariable Long projectId) {
        return service.list(projectId);
    }

    @PostMapping("/projects/{projectId}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto create(@PathVariable Long projectId, @Valid @RequestBody CreateTaskRequest req) {
        return service.create(projectId, req);
    }

    @PatchMapping("/tasks/{id}")
    public TaskDto update(@PathVariable Long id, @Valid @RequestBody UpdateTaskRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
```

For projects, accept `@RequestParam(defaultValue = "") String q` and a `Pageable`, and return `PageResponse.of(page.map(ProjectDto::from))`.

### 7.5 One error shape for every failure

This is the Java side of the `ApiError` type, so the frontend maps errors in one place.

```java
public record ApiError(int status, String message, Map<String, String> fieldErrors) {}

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ApiError> notFound(NotFoundException ex) {
        return ResponseEntity.status(404).body(new ApiError(404, ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(e -> fields.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError(400, "Validation failed", fields));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> unauthorized(AuthenticationException ex) {
        return ResponseEntity.status(401).body(new ApiError(401, "Invalid email or password", null));
    }
}
```

### 7.6 JWT security

Use Spring's built-in resource server support rather than a hand-written JWT filter: less code, fewer security mistakes.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.jwt-secret}")
    private String secret;

    private SecretKey key() {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable()) // stateless API using bearer tokens
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
            .build();
    }

    @Bean JwtDecoder jwtDecoder() { return NimbusJwtDecoder.withSecretKey(key()).build(); }
    @Bean JwtEncoder jwtEncoder() { return new NimbusJwtEncoder(new ImmutableSecret<>(key())); }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    UserDetailsService userDetailsService(UserRepository users) {
        return email -> users.findByEmail(email)
            .map(u -> org.springframework.security.core.userdetails.User
                .withUsername(u.getEmail()).password(u.getPasswordHash()).roles("USER").build())
            .orElseThrow(() -> new UsernameNotFoundException(email));
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

The login endpoint authenticates and signs a token:

```java
@PostMapping("/api/auth/login")
public LoginResponse login(@Valid @RequestBody LoginRequest req) {
    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(req.email(), req.password()));
    Instant now = Instant.now();
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuer("taskflow")
        .issuedAt(now)
        .expiresAt(now.plus(1, ChronoUnit.HOURS))
        .subject(auth.getName())
        .build();
    String token = jwtEncoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    User user = users.findByEmail(auth.getName()).orElseThrow();
    return new LoginResponse(token, UserDto.from(user));
}
```

Seed a demo user at startup with a `CommandLineRunner` that saves `passwordEncoder.encode("password")` when the users table is empty.

### 7.7 Backend tests

1. `@WebMvcTest(TaskController.class)` with the service mocked (`@MockitoBean`, or `@MockBean` on older Spring Boot versions). Assert status codes and JSON with `MockMvc`, and authenticate requests with `.with(jwt())` from `spring-security-test`.
2. `@DataJpaTest` for `ProjectRepository.findByNameContainingIgnoreCase`, checking paging and case-insensitivity.
3. A plain JUnit test for `TaskService.update` partial-update logic.

Done when: `docker compose up -d` plus `./mvnw spring-boot:run` starts the API, Swagger UI at `http://localhost:8080/swagger-ui.html` shows every endpoint, and a request without a token gets 401.

## Step 8: Connect the frontend to the real API

Goal: flip from mocks to Spring Boot with no component changes, then fix whatever the seam reveals.

1. Set `VITE_USE_MOCKS=false` in `.env.development.local` and restart Vite. The `/api` proxy from Step 1 forwards calls to `localhost:8080`, so there is no CORS setup in development.
2. Log in with the seeded user and walk through every screen with the Network tab open.
3. Check the contract field by field: Spring's `Pageable` already uses `page`, `size` and `sort=name,asc`; `LocalDate` arrives as `2026-11-20` and `Instant` as `2026-11-04T10:15:30Z`; enums arrive as `IN_PROGRESS`.
4. Optionally generate types from the live spec and diff them against your hand-written ones:

```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/types/generated.ts
```

5. Trigger each failure on purpose and confirm the UI handles it: wrong password (401 message on the form), empty title (400 with `fieldErrors` under the input), deleted task (404 toast), API stopped (network error banner), expired token (redirect to login).
6. Keep MSW for tests only from here on.

When something breaks, use this order to find it fast:

| Symptom | Look first at |
| --- | --- |
| Request never leaves the browser | Console errors, then the Vite proxy config |
| 401 on every call | `Authorization` header in the Network tab, then token expiry and secret |
| 400 with no field errors | The request payload vs the Java record's field names |
| 500 | Spring Boot console stack trace |
| `LazyInitializationException` | Entity returned or touched outside a transaction; map to a DTO in the service |
| Data correct in Network tab, wrong on screen | Redux DevTools state, then the selector |
| Dates one day off | `LocalDate` parsed with `new Date()` in a non-UTC time zone |

Done when: every screen works against Spring Boot and PostgreSQL, and each failure in item 5 shows a sensible message.

## Step 9: Unit and integration tests with Jest and React Testing Library

Goal: tests that check what the user sees, reuse the MSW handlers, and gate CI at 80% coverage on `features/`.

1. Install Jest with Babel (more forgiving than ts-jest with Vite's TypeScript settings), plus `jest-fixed-jsdom`, the environment MSW recommends for Jest:

```bash
npm install -D jest jest-fixed-jsdom babel-jest @types/jest identity-obj-proxy \
  @babel/preset-env @babel/preset-react @babel/preset-typescript \
  @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

2. `babel.config.cjs`:

```js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
```

3. `jest.config.cjs` (mapper order matters: the env mock must come before the general `@/` alias):

```js
module.exports = {
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^@/lib/env$': '<rootDir>/src/test/envMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx', '!src/mocks/**', '!src/**/*.d.ts'],
  coverageThreshold: { './src/features/': { lines: 80, branches: 70 } },
};
```

`src/test/envMock.ts` is one line: `export const env = { apiUrl: '' };`. Jest cannot parse `import.meta`, which is why Step 5 kept it in one file.

4. `src/test/setup.ts` starts MSW for every test file:

```ts
import '@testing-library/jest-dom';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Export a `resetDb()` from `src/mocks/db.ts` and call it in `afterEach` too, so tests cannot leak data into each other.

5. A render helper with a fresh store per test. `src/test/renderWithProviders.tsx`:

```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { setupStore, type RootState } from '@/app/store';

interface Options {
  preloadedState?: Partial<RootState>;
  route?: string;
}

export function renderWithProviders(ui: ReactElement, { preloadedState, route = '/' }: Options = {}) {
  const store = setupStore(preloadedState);
  return {
    store,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
```

6. Unit test a component by behavior, not implementation:

```tsx
test('a loading button is disabled and ignores clicks', async () => {
  const onClick = jest.fn();
  const user = userEvent.setup();
  render(<Button loading onClick={onClick}>Save</Button>);

  const button = screen.getByRole('button', { name: /save/i });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');

  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});
```

7. Unit test a hook with fake timers:

```ts
test('useDebounce only updates after the delay', () => {
  jest.useFakeTimers();
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'a' },
  });

  rerender({ value: 'ab' });
  expect(result.current).toBe('a');

  act(() => { jest.advanceTimersByTime(300); });
  expect(result.current).toBe('ab');
  jest.useRealTimers();
});
```

8. Unit test reducers as plain functions: `authReducer(undefined, login.fulfilled(payload, 'req1', credentials))` should set the token and user.
9. Integration test a page against MSW, overriding a handler to force the error path:

```tsx
test('shows an error, then recovers on retry', async () => {
  server.use(
    http.get('/api/projects',
      () => HttpResponse.json({ status: 500, message: 'Boom' }, { status: 500 }),
      { once: true }),
  );
  const { user } = renderWithProviders(<ProjectsPage />);

  expect(await screen.findByText(/could not load projects/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /retry/i }));
  expect(await screen.findAllByRole('listitem')).not.toHaveLength(0);
});
```

10. Write these integration tests next, using the same pattern:
    1. Login: wrong password shows the error; correct password navigates to projects.
    2. Search: typing filters the list after the debounce.
    3. Board: changing a card's status with the Select moves it to the new column; with the PATCH forced to 500, it moves back.
    4. Task form: an empty title shows a validation message and sends no request.
11. Add scripts: `"test": "jest"` and `"test:coverage": "jest --coverage"`.

Rules of thumb: query by role, label or text (`getByTestId` is the last resort); use `findBy` for anything async; never assert on Redux state when you can assert on the screen.

Done when: `npm run test:coverage` passes the 80% threshold and every test still passes after you refactor a component's internals.

## Step 10: Performance pass

Goal: measure first, change one thing, measure again. An optimization without a before/after number does not count.

1. Seed 5,000 activity entries and 300 tasks in one project so problems become visible.
2. Take baselines on a production build (`npm run build && npm run preview`), not the dev server:
   1. Lighthouse in Chrome DevTools (mobile preset).
   2. React DevTools Profiler: record dragging one card and typing in search. Turn on "Highlight updates when components render".
   3. Web Vitals in the console:

```ts
// main.tsx, after npm install web-vitals
import { onCLS, onINP, onLCP } from 'web-vitals';
onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

3. Look at the bundle:

```ts
// vite.config.ts, after npm install -D rollup-plugin-visualizer
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), visualizer({ gzipSize: true, open: true })],
```

4. Fix wasted renders the Profiler shows: split components so state lives where it is used, memoize list items with `React.memo`, keep props stable with `useCallback` and `useMemo`, and use `selectFromResult` so components subscribe to only the data they render.
5. Virtualize the activity log so only visible rows are in the DOM:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function ActivityLog({ items }: { items: Activity[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className={styles.viewport}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div key={row.key} className={styles.row}
               style={{ height: row.size, transform: `translateY(${row.start}px)` }}>
            <ActivityRow item={items[row.index]!} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

6. Code-split anything heavy that is not on the first screen: the chart library, the task form modal, the kit page.
7. Mark non-urgent updates with `useTransition` (for example, re-filtering a large board) and check whether INP improves.
8. Record results in this table:

| Metric | Before | After | Change that moved it |
| --- | --- | --- | --- |
| Lighthouse performance (mobile) |  |  |  |
| LCP (ms) |  |  |  |
| INP (ms) |  |  |  |
| Initial JS, gzipped (KB) |  |  |  |
| Board render on drag (ms, Profiler) |  |  |  |
| DOM nodes on activity page |  |  |  |

Done when: the table is filled in and you can explain why each change helped, or why one you expected to help did not.

## Step 11: CI, framework upgrade and deployment

Goal: every pull request is checked automatically, the stack can be upgraded safely, and the app runs somewhere other than your laptop.

### 11.1 Continuous integration

The Spring Initializr adds a `@SpringBootTest` that needs a database, so first add `src/test/resources/application.yml` with `spring.datasource.url: jdbc:h2:mem:taskflow` to run backend tests on H2. Then `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: taskflow-web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: taskflow-web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build   # the Vite template's build also type-checks

  api:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: taskflow-api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven
      - run: ./mvnw -B verify
```

Then make both jobs required checks in the branch protection rule for `main`.

### 11.2 Framework upgrade drill

1. On a branch, pin an older stack (for example React 18 and React Router 6), commit, and confirm everything passes.
2. Run `npx npm-check-updates` to see what is behind, then upgrade one major version at a time, never all at once.
3. Read each official upgrade guide before changing code. React's guide for version 19 points to codemods, such as `npx codemod@latest react/19/migration-recipe` and `npx types-react-codemod@latest preset-19 ./src`.
4. After each upgrade, run lint, tests and the build, fix what broke, and commit separately so `git bisect` can isolate a problem later.
5. Do the same for Spring Boot using its release notes and migration guide.
6. Keep an upgrade log:

| Package | From | To | What broke | Fix |
| --- | --- | --- | --- | --- |
| react, react-dom |  |  |  |  |
| react-router-dom |  |  |  |  |
| @reduxjs/toolkit |  |  |  |  |
| spring-boot |  |  |  |  |

### 11.3 Deployment

1. API: deploy to Render or Railway with a managed PostgreSQL. Set `JWT_SECRET` and the datasource variables as environment variables, never in Git.
2. Allow the deployed frontend's origin, since the dev proxy no longer applies. Add `.cors(Customizer.withDefaults())` to the filter chain and this bean:

```java
@Bean
CorsConfigurationSource corsConfigurationSource(@Value("${app.allowed-origin}") String origin) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(origin));
    config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

3. Frontend: deploy to Vercel or Netlify with `VITE_API_URL` set to the API's URL. Add an SPA fallback so deep links like `/projects/3/board` do not 404 (on Netlify, a `public/_redirects` file containing `/* /index.html 200`).
4. Smoke test the deployed app: log in, drag a card, refresh on a deep link.

### 11.4 Wrap up

- [ ] README with setup steps, scripts, architecture diagram and screenshots
- [ ] Three ADRs in `docs/adr/` (state management, styling, folder structure)
- [ ] Bug log from the debugging drills in the practice plan
- [ ] Performance table from Step 10 filled in
- [ ] Tag `v1.0.0` with release notes

Done when: a pull request with a failing test cannot be merged, the upgrade log has at least two entries, and the deployed URL works from your phone.
