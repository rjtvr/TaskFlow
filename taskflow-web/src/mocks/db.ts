import { faker } from '@faker-js/faker';
import type { Priority, Project, Task, TaskStatus, User } from '@/types/api';

// Fixed seed so every run (and every test) sees the same data.
faker.seed(42);

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];

const users: User[] = Array.from({ length: 3 }, (_, i) => ({
  id: i + 1,
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
}));

const projects: Project[] = Array.from({ length: 5 }, (_, i) => {
  const name = `${faker.word.adjective()} ${faker.word.noun()}`;
  return {
    id: i + 1,
    key: name.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase(),
    name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
    description: faker.lorem.sentence(),
  };
});

const tasks: Task[] = Array.from({ length: 60 }, (_, i) => {
  const createdAt = faker.date.recent({ days: 30 });
  return {
    id: i + 1,
    projectId: (i % projects.length) + 1,
    title: faker.hacker.phrase().slice(0, 120),
    description: faker.lorem.sentences(2),
    status: faker.helpers.arrayElement(STATUSES),
    priority: faker.helpers.arrayElement(PRIORITIES),
    assigneeId: faker.helpers.arrayElement(users).id,
    dueDate: faker.date.soon({ days: 30 }).toISOString().slice(0, 10),
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
  };
});

// In-memory database. Handlers mutate it, so changes last until a page reload.
export const db = { users, projects, tasks };
