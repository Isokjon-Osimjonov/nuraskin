import { createFileRoute } from '@tanstack/react-router';
import { ProductCreatePage } from '../../../app/products/ProductCreatePage';
import { z } from 'zod';

const productSearchSchema = z.object({
  barcode: z.string().optional(),
});

export const Route = createFileRoute('/_app/products/new')({
  validateSearch: (search) => productSearchSchema.parse(search),
  component: NewProductPage,
});

function NewProductPage() {
  const { barcode } = Route.useSearch();
  return <ProductCreatePage prefilledBarcode={barcode} />;
}
