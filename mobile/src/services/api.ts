import { API_BASE_URL } from '../config';
import type { AcademicCourse, AcademicProgram, AcademicSchool, Course, CourseResource, Group, Resource, Session, User } from '../types/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let token = '';
let unauthorizedHandler: (() => void) | undefined;

export function setApiToken(value: string) {
  token = value;
}

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  unauthorizedHandler = handler;
}

function messageForStatus(status: number, fallback: string) {
  if (status === 400) return fallback || 'Please check the information and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform that action.';
  if (status === 404) return 'The requested StudyLink item could not be found.';
  if (status === 409) return fallback || 'That action conflicts with existing StudyLink data.';
  if (status >= 500) return 'StudyLink is temporarily unavailable. Please try again shortly.';
  return fallback || 'StudyLink could not complete that request.';
}

async function request<T>(path: string, options: RequestInit = {}) {
  if (!API_BASE_URL) throw new Error('StudyLink API is not configured. Set EXPO_PUBLIC_API_BASE_URL and restart the app.');
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Unable to reach StudyLink. Check your connection and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
    const serverMessage = typeof payload?.message === 'string' ? payload.message : '';
    throw new ApiError(messageForStatus(response.status, serverMessage), response.status);
  }
  return payload as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (fullName: string, email: string, password: string, university: string) =>
    request<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, university }),
    }),
  me: () => request<{ user: User }>('/api/auth/me'),
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  profile: () => request<User>('/api/profile'),
  updateProfile: (updates: Partial<User>) =>
    request<User>('/api/profile', { method: 'PATCH', body: JSON.stringify(updates) }),
  courses: () => request<{ courses: Course[] }>('/api/courses'),
  enrollCourse: (id: number) =>
    request<{ course: Course }>(`/api/courses/${id}/enroll`, { method: 'POST' }),
  groups: () => request<{ groups: Group[] }>('/api/groups'),
  group: (id: number) => request<{ group: Group & { sessions: Session[] } }>(`/api/groups/${id}`),
  createGroup: (body: Record<string, unknown>) =>
    request<{ group: Group }>('/api/groups', { method: 'POST', body: JSON.stringify(body) }),
  updateGroup: (id: number, body: Record<string, unknown>) =>
    request<{ group: Group }>(`/api/groups/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGroup: (id: number) =>
    request<void>(`/api/groups/${id}`, { method: 'DELETE' }),
  enrollGroup: (id: number) =>
    request<{ group: Group }>(`/api/groups/${id}/enroll`, { method: 'POST' }),
  sessions: () => request<{ sessions: Session[] }>('/api/sessions'),
  session: (id: number) => request<{ session: Session }>(`/api/sessions/${id}`),
  enrollSession: (id: number) =>
    request<{ session: Session }>(`/api/sessions/${id}/enroll`, { method: 'POST' }),
  createSession: (body: Record<string, unknown>) =>
    request<{ session: Session }>('/api/sessions', { method: 'POST', body: JSON.stringify(body) }),
  updateSession: (id: number, body: Record<string, unknown>) =>
    request<{ session: Session }>(`/api/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSession: (id: number) =>
    request<void>(`/api/sessions/${id}`, { method: 'DELETE' }),
  resources: () => request<{ resources: Resource[] }>('/api/resources'),
  resource: (id: number) => request<{ resource: Resource }>(`/api/resources/${id}`),
  library: () => request<{ resources: Resource[] }>('/api/my/resources'),
  saveResource: (id: number) =>
    request<{ resource: Resource }>(`/api/resources/${id}/enroll`, { method: 'POST' }),
  reportContent: (contentType: 'group' | 'resource', contentId: number, reason: string, details = '') =>
    request<{ report: { id: number; status: string } }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ contentType, contentId, reason, details }),
    }),
  academicSchools: () => request<{ schools: AcademicSchool[] }>('/api/academic/schools'),
  academicPrograms: (schoolId?: number) =>
    request<{ programs: AcademicProgram[] }>(`/api/academic/programs${schoolId ? `?schoolId=${schoolId}` : ''}`),
  academicCourses: (programId?: number) =>
    request<{ courses: AcademicCourse[] }>(`/api/academic/courses${programId ? `?programId=${programId}` : ''}`),
  academicCourse: (id: number) => request<{ course: AcademicCourse }>(`/api/academic/courses/${id}`),
  academicCourseResources: (id: number) =>
    request<{ resources: CourseResource[] }>(`/api/academic/courses/${id}/resources`),
};
