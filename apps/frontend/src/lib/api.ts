import { STORAGE_KEYS } from '@nuraskin/shared-utils';

function getCustomerToken(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.APP_STORE);
    if (stored) return JSON.parse(stored)?.state?.token ?? '';
  } catch { /* silent */ }
  return '';
}

export async function storefrontApi<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (requiresAuth) {
    const token = getCustomerToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get:  <T>(path: string, o?: RequestInit) =>
          storefrontApi<T>(path, { method: 'GET', ...o }),
  post: <T>(path: string, body: unknown, o?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'POST',
            body: JSON.stringify(body), ...o }),
  patch: <T>(path: string, body: unknown, o?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'PATCH',
            body: JSON.stringify(body), ...o }),
  put:   <T>(path: string, body: unknown, o?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'PUT',
            body: JSON.stringify(body), ...o }),
  delete: <T>(path: string, o?: RequestInit) =>
          storefrontApi<T>(path, { method: 'DELETE', ...o }),

  auth: {
    get:    <T>(path: string, o?: RequestInit) =>
              storefrontApi<T>(path, { method: 'GET', ...o }, true),
    post:   <T>(path: string, body: unknown, o?: RequestInit) =>
              storefrontApi<T>(path, {
                method: 'POST',
                body: JSON.stringify(body), ...o }, true),
    patch:  <T>(path: string, body: unknown, o?: RequestInit) =>
              storefrontApi<T>(path, {
                method: 'PATCH',
                body: JSON.stringify(body), ...o }, true),
    delete: <T>(path: string, o?: RequestInit) =>
              storefrontApi<T>(path, { method: 'DELETE', ...o }, true),
  },
};
