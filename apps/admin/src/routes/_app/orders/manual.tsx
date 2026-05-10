import { createFileRoute } from '@tanstack/react-router';
import { ManualOrderPage } from '../../../app/orders/ManualOrderPage';

export const Route = createFileRoute('/_app/orders/manual')({
  component: ManualOrderPage,
});
