import { describe, it, expect } from 'vitest';

describe('GET /api/health', () => {
  it('returns status ok with message', async () => {
    const baseUrl = process.env['BASE_URL'] ?? 'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; message: string };
    expect(body.status).toBe('ok');
    expect(typeof body.message).toBe('string');
  });
});
