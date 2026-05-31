import { STORAGE_KEYS } from '@nuraskin/shared-utils';

function getToken(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (stored) return JSON.parse(stored)?.state?.token ?? '';
  } catch {
    /* silent */
  }
  return '';
}

export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, o?: RequestInit) => adminApi<T>(path, { method: 'GET', ...o }),
  post: <T>(path: string, body: unknown, o?: RequestInit) =>
    adminApi<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...o,
    }),
  patch: <T>(path: string, body: unknown, o?: RequestInit) =>
    adminApi<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...o,
    }),
  put: <T>(path: string, body: unknown, o?: RequestInit) =>
    adminApi<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...o,
    }),
  delete: <T>(path: string, o?: RequestInit) => adminApi<T>(path, { method: 'DELETE', ...o }),
};
