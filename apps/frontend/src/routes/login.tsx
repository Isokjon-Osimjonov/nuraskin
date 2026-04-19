import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const botId = import.meta.env['VITE_TELEGRAM_BOT_ID'] ?? '';

  const handleTelegramLogin = () => {
    const params = new URLSearchParams({
      bot_id: botId,
      origin: window.location.origin,
      return_to: `${window.location.origin}/account`,
    });
    window.location.href = `https://oauth.telegram.org/auth?${params.toString()}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)' }}
    >
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-sm w-full">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-tight">NuraSkin</h1>
          <p className="text-white/60 text-sm mt-1">Hisobingizga kiring</p>
        </div>

        <div className="border-t border-white/10 my-6" />

        <button
          onClick={handleTelegramLogin}
          className="w-full rounded-xl py-3 px-6 text-white font-medium flex items-center justify-center gap-3 transition-colors"
          style={{ backgroundColor: '#2AABEE' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#229ED9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2AABEE';
          }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.03 9.568c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 14.053l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.63.532z" />
          </svg>
          Telegram orqali kirish
        </button>

        <p className="text-white/30 text-xs text-center mt-4">
          Telegram akkauntingiz kerak bo&apos;ladi
        </p>

        <div className="text-center mt-8">
          <a
            href="/"
            className="text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            ← Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    </div>
  );
}
