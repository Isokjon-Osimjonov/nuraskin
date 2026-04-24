import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/accounting')({
  component: AccountingPage,
});

function AccountingPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Accounting</h1>
      <p className="text-muted-foreground">Manage your finances and transactions</p>
    </div>
  );
}
