import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Bell, ChevronRight, Trash2, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlist, useToggleWaitlist } from '@/hooks/useWaitlist';

export const Route = createFileRoute('/_protected/waiting-list')({
  component: WaitingListPage,
});

function WaitingListPage() {
  const { isAuthenticated, addToCart } = useAppStore();
  const navigate = useNavigate();
  const { data, isLoading } = useMyWaitlist();
  const { remove } = useToggleWaitlist();

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

  const entries = data?.data ?? [];

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#f8f7f5] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-1/2" />
                </div>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {entries.map((entry: { _id: string; productId: Record<string, any> }) => {
                const product = entry.productId;
                const isAvailable = product.inStock;
                const formatPrice = (p: number) =>
                  new Intl.NumberFormat('uz-UZ').format(p) + ' so\'m';

                return (
                  <div key={entry._id} className="flex flex-col bg-[#f8f7f5] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                    <Link to={`/products`} className="block relative aspect-square overflow-hidden">
                      <img
                        src={product.images[0] || ''}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <span className="bg-white/90 text-red-600 text-[11px] font-normal px-3 py-1 rounded-full">
                            Mavjud emas
                          </span>
                        </div>
                      )}
                      {isAvailable && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-emerald-500 text-white text-[11px] font-normal px-3 py-1 rounded-full">
                            Mavjud!
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-col flex-1 p-4">
                      {product.brand && (
                        <span className="text-[11px] font-light text-stone-400 mb-1">{product.brand}</span>
                      )}
                      <Link to={`/products`}>
                        <h3 className="text-[13px] font-normal text-[#4A1525] leading-snug mb-2 line-clamp-2 hover:opacity-80 transition-opacity">
                          {product.name}
                        </h3>
                      </Link>
                      <span className="text-[13px] font-normal text-[#4A1525] mb-4">
                        {formatPrice(product.currentPriceUZS)}
                      </span>

                      <div className="flex items-center gap-2 mt-auto">
                        {isAvailable ? (
                          <button
                            onClick={() =>
                              addToCart({
                                id: product._id,
                                name: product.name,
                                price: product.currentPriceUZS,
                                image: product.images[0] || '',
                                slug: product.slug,
                                stock: product.totalStock,
                              })
                            }
                            className="flex-1 h-9 bg-[#4A1525] text-white text-[12px] font-light rounded-full hover:bg-[#6B2540] transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Savatchaga
                          </button>
                        ) : (
                          <div className="flex-1 flex items-center gap-2 h-9 bg-stone-100 rounded-full px-4">
                            <Bell className="w-3.5 h-3.5 text-[#4A1525]" />
                            <span className="text-[12px] font-light text-stone-600">Kutilmoqda</span>
                          </div>
                        )}

                        <button
                          onClick={() => remove.mutate(product._id)}
                          disabled={remove.isPending}
                          aria-label="O'chirish"
                          className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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