/**
 * Admin API client
 * - Always uses relative /api (Vite proxy in dev,
 *   Nginx in prod — transparent to this code)
 * - Auto-injects auth token from auth store
 * - Standardized error handling
 */

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string {
  try {
    const keys = Object.keys(localStorage);
    console.log('[ADMIN TOKEN DEBUG] keys:', keys);
    // Try each key
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val?.includes('"token"')) {
        const parsed = JSON.parse(val);
        const token = parsed?.state?.token
          ?? parsed?.token;
        if (token) {
          console.log('[ADMIN TOKEN DEBUG] found in:', key);
          return token;
        }
      }
    }
    return '';
  } catch { return ''; }
}

export async function adminApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    throw new ApiError(
      res.status,
      body.message ?? body.error ?? `HTTP ${res.status}`,
      body
    );
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Convenience methods
export const api = {
  get:    <T>(path: string, opts?: RequestInit) =>
            adminApi<T>(path, { method: 'GET', ...opts }),
  post:   <T>(path: string, body: unknown, opts?: RequestInit) =>
            adminApi<T>(path, {
              method: 'POST',
              body: JSON.stringify(body), ...opts }),
  patch:  <T>(path: string, body: unknown, opts?: RequestInit) =>
            adminApi<T>(path, {
              method: 'PATCH',
              body: JSON.stringify(body), ...opts }),
  put:    <T>(path: string, body: unknown, opts?: RequestInit) =>
            adminApi<T>(path, {
              method: 'PUT',
              body: JSON.stringify(body), ...opts }),
  delete: <T>(path: string, opts?: RequestInit) =>
            adminApi<T>(path, { method: 'DELETE', ...opts }),
};

export { ApiError };
