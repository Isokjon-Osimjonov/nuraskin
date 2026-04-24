import { createFileRoute } from '@tanstack/react-router';
import { ProductEditPage } from '../../../app/products/ProductEditPage';

export const Route = createFileRoute('/_app/products/$productId')({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  return <ProductEditPage productId={productId} />;
}
