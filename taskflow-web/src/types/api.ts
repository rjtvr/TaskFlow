// Source of truth for the API shape. Java DTO records (Step 7) match these
// field for field. Change a type here and its DTO together.

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description?: string;
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: number;
  dueDate?: string; // ISO date, e.g. 2026-11-20
  createdAt: string; // ISO instant
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
