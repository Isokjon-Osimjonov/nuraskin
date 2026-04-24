import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/coupons')({
  component: CouponsPage,
});

function CouponsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Coupons</h1>
      <p className="text-muted-foreground">Manage discount codes and promotions</p>
    </div>
  );
}
