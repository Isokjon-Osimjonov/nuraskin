import { Link, useNavigate } from '@tanstack/react-router';
import { Heart, ShoppingBag, Bell, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useCart, useAddToCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { formatUzs, formatKrw } from '@/lib/utils';

export function RecentProductsSection() {
  const { regionCode, isAuthenticated, favorites, toggleFavorite } = useAppStore();
  const navigate = useNavigate();
  const { data: productsData, isLoading } = useProducts({ limit: 8 });
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();

  const products = productsData?.data ?? [];
  const latestProducts = products.slice(0, 4);

  const formatPrice = (val: number | string) => {
    if (!val || val === '0') return "Narx ko'rsatilmagan";
    if (regionCode === 'KOR') return formatKrw(val);
    return formatUzs(val);
  };

  if (isLoading) {
    return (
      <section className="bg-white py-14 min-h-[70vh] flex flex-col justify-center">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4A1525]" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-14 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">

        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-[22px] md:text-[26px] font-light tracking-wide text-[#4A1525]">
            So&apos;nggi mahsulotlar
          </h2>
          <Link
            to="/products"
            className="text-[12px] font-light text-stone-500 hover:text-[#4A1525] transition-colors tracking-wide"
          >
            Barchasini ko&apos;rish
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {latestProducts.map((product) => {
            const isFav = favorites.some((f: any) => f.id === product.id);
            const isInCart = cartData?.items?.some((i: any) => i.productId === product.id);

            return (
              <div
                key={product.id}
                className="group flex flex-col bg-[#f8f7f5] rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >

                {/* Image */}
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="block relative aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={product.imageUrls[0] || '/nsb.png'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {product.brandName && (
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] text-[#4A1525] font-light">
                      {product.brandName}
                    </div>
                  )}
                  {product.categoryName && (
                    <div className="absolute bottom-3 left-3 bg-[#4A1525]/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] text-white font-light">
                      {product.categoryName}
                    </div>
                  )}
                  {(!product.inStock || product.availableStock <= 0) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="bg-white/90 text-red-600 text-[11px] font-medium px-3 py-1 rounded-full">Mavjud emas</span>
                    </div>
                  )}
                  {/* Wishlist button */}
                  <button
                    aria-label="Sevimli"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors ${
                      isFav ? 'text-[#4A1525]' : 'text-stone-400 hover:text-[#4A1525]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} strokeWidth={1.5} />
                  </button>
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-3 pt-2">
                  <Link to="/products/$slug" params={{ slug: product.slug }}>
                    <h3 className="text-[12px] font-light text-[#4A1525] leading-snug mb-1 group-hover:opacity-80 transition-opacity line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[12px] font-light text-[#4A1525]">
                      {formatPrice(product.calculatedPrice)}
                    </span>
                    {(!product.inStock || product.availableStock <= 0) ? (
                      <button
                        aria-label="Xabardor qiling"
                        className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 hover:bg-[#4A1525] hover:text-white flex items-center justify-center transition-all duration-200"
                      >
                        <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <button
                        aria-label="Savatga qo'shish"
                        onClick={() => {
                          if (!isAuthenticated) { navigate({ to: '/login' }); return; }
                          addToCart.mutate({
                            productId: product.id,
                            quantity: 1,
                            regionCode: regionCode as string,
                          });
                        }}
                        disabled={addToCart.isPending}
                        className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center border ${
                          isInCart
                            ? 'bg-[#4A1525] border-[#4A1525] text-white hover:bg-[#6B2540]'
                            : 'bg-white border-stone-200 text-[#4A1525] hover:border-[#4A1525]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
