import { useAppStore } from '@/stores/app.store';

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { regionCode, token } = useAppStore.getState();
  const baseUrl = 'http://localhost:4000/api';

  // Construct final URL with region
  let finalUrl = `${baseUrl}${url}`;
  if (url.includes('/storefront')) {
    const separator = url.includes('?') ? '&' : '?';
    if (regionCode) {
      finalUrl += `${separator}region=${regionCode}`;
    }
  }

  const res = await fetch(finalUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    }
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'API fetch failed' }));
    throw new Error(error.message || 'API fetch failed');
  }

  return await res.json();
}