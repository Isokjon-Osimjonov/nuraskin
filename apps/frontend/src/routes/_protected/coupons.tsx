import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Ticket, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useEffect } from 'react';

export const Route = createFileRoute('/_protected/coupons')({
  component: CouponsPage,
});

function CouponsPage() {
  const { isAuthenticated } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile" className="text-stone-400 hover:text-stone-700 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-medium text-[#4A1525]">Kuponlarim</h1>
        </div>

        <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
          <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-4" strokeWidth={1.2} />
          <p className="text-[14px] font-light text-stone-500">Sizda faol kuponlar yo'q</p>
        </div>
      </div>
    </div>
  );
}