import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/telegram')({
  component: TelegramPage,
});

function TelegramPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-medium tracking-tight">Telegram Posting</h1>
      <p className="text-muted-foreground">Manage automated posts to your Telegram channels</p>
    </div>
  );
}
