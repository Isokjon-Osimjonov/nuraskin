import { createFileRoute } from '@tanstack/react-router';
import { CustomerDetailPage } from '@/app/customers/CustomerDetailPage';

export const Route = createFileRoute('/_app/customers/$id')({
  component: CustomerDetailPage,
});
