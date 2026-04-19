import { beforeAll } from 'vitest';

beforeAll(() => {
  const host = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ?? '4000';
  process.env['BASE_URL'] = `http://${host}:${port}`;
});
