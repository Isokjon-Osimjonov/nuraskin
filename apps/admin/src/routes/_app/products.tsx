import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Products</h1>
      <p className="text-muted-foreground">Manage your product catalog</p>
    </div>
  );
}
