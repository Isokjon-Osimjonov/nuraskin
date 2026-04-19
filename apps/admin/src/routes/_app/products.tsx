import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/products')({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Products</h1>
      <p className="text-muted-foreground">Products management coming soon.</p>
    </div>
  );
}
