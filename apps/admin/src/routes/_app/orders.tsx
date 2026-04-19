import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/orders')({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Orders</h1>
      <p className="text-muted-foreground">Orders management coming soon.</p>
    </div>
  );
}
