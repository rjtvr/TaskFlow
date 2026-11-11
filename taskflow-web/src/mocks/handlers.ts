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
      page,
      size,
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

  // Still to write, same pattern: POST /api/projects, GET and POST
  // /api/projects/:id/tasks, DELETE /api/tasks/:id, GET and POST
  // /api/tasks/:id/comments.
];
