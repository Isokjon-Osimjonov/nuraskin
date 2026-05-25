/**
 * Storefront API client
 * - Always uses relative /api
 * - No auth token (public storefront)
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

// Get customer token from auth store
function getCustomerToken(): string {
  try {
    const raw = localStorage.getItem('nuraskin-app-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? '';
    }
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
    throw new ApiError(
      res.status,
      body.message ?? body.error ?? `HTTP ${res.status}`,
      body
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Public endpoints
  get:  <T>(path: string, opts?: RequestInit) =>
          storefrontApi<T>(path, { method: 'GET', ...opts }),
  post: <T>(path: string, body: unknown, opts?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'POST',
            body: JSON.stringify(body), ...opts }),
  patch:  <T>(path: string, body: unknown, opts?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'PATCH',
            body: JSON.stringify(body), ...opts }),
  put:    <T>(path: string, body: unknown, opts?: RequestInit) =>
          storefrontApi<T>(path, {
            method: 'PUT',
            body: JSON.stringify(body), ...opts }),
  delete: <T>(path: string, opts?: RequestInit) =>
          storefrontApi<T>(path, { method: 'DELETE', ...opts }),

  // Protected endpoints (requires customer login)
  auth: {
    get:    <T>(path: string, opts?: RequestInit) =>
              storefrontApi<T>(path, { method: 'GET', ...opts }, true),
    post:   <T>(path: string, body: unknown, opts?: RequestInit) =>
              storefrontApi<T>(path, {
                method: 'POST',
                body: JSON.stringify(body), ...opts }, true),
    patch:  <T>(path: string, body: unknown, opts?: RequestInit) =>
              storefrontApi<T>(path, {
                method: 'PATCH',
                body: JSON.stringify(body), ...opts }, true),
    delete: <T>(path: string, opts?: RequestInit) =>
              storefrontApi<T>(path, { method: 'DELETE', ...opts }, true),
  },
};

export { ApiError };
