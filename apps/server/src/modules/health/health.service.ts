import { InternalError } from '../../common/errors/AppError';
import * as repository from './health.repository';

export interface HealthStatus {
  status: 'ok';
  message: string;
}

export async function getHealth(): Promise<HealthStatus> {
  const row = await repository.findLatest();

  if (!row) {
    throw new InternalError('No health check record found');
  }

  return { status: 'ok', message: row.message };
}
