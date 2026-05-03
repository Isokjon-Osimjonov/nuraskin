import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Bell, ChevronRight, Trash2, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlist, useToggleWaitlist } from '@/hooks/useWaitlist';
import { useAddToCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export const Route = createFileRoute('/_protected/waiting-list')({
  component: WaitingListPage,
});

function WaitingListPage() {
  const { isAuthenticated, regionCode } = useAppStore();
  const navigate = useNavigate();
  const { data: entries = [], isLoading } = useMyWaitlist();
  const { remove } = useToggleWaitlist();
  const addToCart = useAddToCart();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-6 text-center">
        <Bell className="w-12 h-12 text-stone-300 mb-4" strokeWidth={1} />
        <h2 className="text-xl font-normal text-[#4A1525] mb-3">Tizimga kiring</h2>
        <p className="text-[13px] font-light text-stone-500 mb-6">Kutish ro'yxatini ko'rish uchun tizimga kiring</p>
        <button
          onClick={() => navigate({ to: '/login' })}
          className="px-6 py-2.5 bg-[#4A1525] text-white text-[13px] font-light rounded-full hover:bg-[#6B2540] transition-colors"
        >
          Kirish
        </button>
      </div>
    );
  }

  const displayPrice = (price: number | string) =>
    formatPrice(price, regionCode as 'UZB' | 'KOR');

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center text-[13px] font-light text-stone-400 mb-8">
          <Link to="/" className="hover:text-[#4A1525] transition-colors">Bosh sahifa</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <Link to="/profile" className="hover:text-[#4A1525] transition-colors">Profil</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-stone-700 font-normal">Kutish ro'yxati</span>
        </nav>

        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-[#4A1525]" strokeWidth={1.5} />
          <h1 className="text-2xl font-normal text-[#4A1525]">Kutish ro'yxati</h1>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#f8f7f5] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="w-12 h-12 text-stone-200 mb-4" strokeWidth={1} />
            <h2 className="text-lg font-normal text-stone-600 mb-2">Kutish ro'yxati bo'sh</h2>
            <p className="text-[13px] font-light text-stone-400 mb-6 max-w-xs">
              Mavjud bo'lmagan mahsulot sahifasida "Xabardor qiling" tugmasini bosing
            </p>
            <Link
              to="/products"
              className="px-6 py-2.5 border border-stone-300 text-stone-700 text-[13px] font-light rounded-full hover:border-[#4A1525] hover:text-[#4A1525] transition-colors"
            >
              Katalogga o'tish
            </Link>
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <>
            <p className="text-[13px] font-light text-stone-500 mb-6">
              Quyidagi mahsulotlar omborda paydo bo'lganda Telegram orqali xabardor qilinasiz.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entries.map((entry) => {
                const product = entry.product;
                const isAvailable = product.inStock;

                return (
                  <div key={entry.id} className="flex gap-3 p-3 bg-white rounded-xl border border-stone-100 hover:border-stone-200 transition-colors shadow-sm">
                    {/* Image: fixed small square */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 p-1">
                      <img
                        src={product.imageUrls?.[0] || ''}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Content: flex-1 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-stone-400 uppercase tracking-tight truncate">{product.brand}</p>
                        <Link to="/products/$slug" params={{ slug: product.slug }}>
                          <p className="text-sm font-medium text-[#4A1525] truncate hover:text-[#6B2540] transition-colors">{product.name}</p>
                        </Link>
                        <p className="text-sm font-semibold text-[#4A1525]">{displayPrice(product.currentPriceUZS)}</p>
                      </div>
                      
                      {/* Status badge */}
                      <div>
                        {isAvailable ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Mavjud!
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-50 text-stone-500 border border-stone-100">
                            Kutilmoqda
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions: right side */}
                    <div className="flex flex-col gap-2 items-end justify-between">
                      <button 
                        onClick={() => remove.mutate(product.id)}
                        disabled={remove.isPending}
                        className="text-stone-300 hover:text-red-500 transition-colors"
                        aria-label="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {isAvailable && (
                        <button 
                          onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
                          disabled={addToCart.isPending}
                          className="h-8 px-3 bg-[#4A1525] text-white text-[11px] font-medium rounded-lg hover:bg-[#6B2540] transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Savatchaga
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
