export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isPublic = url.includes('/public');
  const baseUrl = isPublic ? 'http://localhost:4000/api' : 'http://localhost:4000/api'; // Adjust for your needs
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });

  if (!res.ok) {
    throw new Error('API fetch failed');
  }

  return await res.json();
}