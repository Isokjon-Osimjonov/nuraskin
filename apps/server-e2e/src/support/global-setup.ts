import { waitForPortOpen } from '@nx/node/utils';

export default async function () {
  const host = process.env['HOST'] ?? 'localhost';
  const port = process.env['PORT'] ? Number(process.env['PORT']) : 4000;
  await waitForPortOpen(port, { host });
}
