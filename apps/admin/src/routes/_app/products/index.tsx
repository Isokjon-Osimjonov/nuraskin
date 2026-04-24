import { createFileRoute } from '@tanstack/react-router';
import { ProductsPage } from '../../../app/products/ProductsListPage';

export const Route = createFileRoute('/_app/products/')({
  component: ProductsPage,
});
