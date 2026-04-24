import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useEffect } from 'react';

export const Route = createFileRoute('/_protected/favorites')({
  component: FavoritesPage,
});

function FavoritesPage() {
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
          <h1 className="text-xl font-normal text-[#4A1525]">Sevimlilar</h1>
        </div>

        <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" strokeWidth={1.2} />
          <p className="text-[14px] font-light text-stone-500">Hali sevimlilar yo'q</p>
          <Link to="/products" className="inline-block mt-4 text-[13px] font-normal text-[#4A1525] hover:underline">
            Katalogga o'tish →
          </Link>
        </div>
      </div>
    </div>
  );
}