import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/orders')({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Orders</h1>
      <p className="text-muted-foreground">Manage and track customer orders</p>
    </div>
  );
}
