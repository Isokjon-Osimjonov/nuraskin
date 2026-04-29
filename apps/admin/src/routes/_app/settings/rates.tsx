import { createFileRoute } from '@tanstack/react-router';
import { RatesPage } from '../../../app/settings/RatesPage';

export const Route = createFileRoute('/_app/settings/rates')({
  component: RatesPage,
});
