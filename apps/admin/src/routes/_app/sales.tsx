import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/sales')({
  component: SalesPage,
});

function SalesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Sales</h1>
      <p className="text-muted-foreground">View your sales performance and analytics</p>
    </div>
  );
}
