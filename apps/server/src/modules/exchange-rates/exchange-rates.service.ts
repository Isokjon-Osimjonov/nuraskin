import * as repository from './exchange-rates.repository';
import type { CreateExchangeRateInput } from '@nuraskin/shared-types';

export async function getLatestRate() {
  return await repository.getLatest();
}

export async function listRates() {
  return await repository.findAll();
}

export async function addRate(input: CreateExchangeRateInput, userId: string) {
  return await repository.create({
    krwToUzs: input.krwToUzs,
    cargoRateKrwPerKg: input.cargoRateKrwPerKg,
    note: input.note || null,
    createdBy: userId,
  });
}
