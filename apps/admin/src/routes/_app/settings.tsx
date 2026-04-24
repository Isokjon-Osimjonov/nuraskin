import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
      <p className="text-muted-foreground">Configure your store settings</p>
    </div>
  );
}
