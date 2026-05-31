import { Link, useNavigate } from '@tanstack/react-router';
import { ShoppingBag, Bell } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useCart, useAddToCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice, cn } from '@/lib/utils';
import { typography } from '@/lib/typography';
import { EmptySection } from '@/components/shared/EmptySection';

export function RecentProductsSection() {
  const { regionCode, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  const { data: productsData, isLoading } = useProducts({ limit: 8 });
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();

  const products = productsData?.data ?? [];
  const latestProducts = Array.isArray(products) ? products.slice(0, 4) : [];

  const displayPrice = (val: number | string) => {
    if (!val || val === '0') return "Narx ko'rsatilmagan";
    return formatPrice(val, regionCode as 'UZB' | 'KOR');
  };

  return (
    <section className="px-4 md:px-6 py-12">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-8">
          <div className="space-y-1">
            <p className={typography.sectionLabel}>Tanlovimiz</p>
            <h2 className={typography.sectionTitle}>So&apos;nggi mahsulotlar</h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-normal text-stone-400 hover:text-[#4A1525] transition-colors tracking-wide"
          >
            Barchasini ko&apos;rish
          </Link>
        </div>

        <div className="w-full mt-6">
          {isLoading ? (
            /* Loading state — skeleton grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-stone-100 animate-pulse h-80" />
              ))}
            </div>
          ) : latestProducts.length === 0 ? (
            /* Empty state */
            <EmptySection
              title="Mahsulotlar hali mavjud emas"
              subtitle="Tez orada yangi mahsulotlar qo'shiladi"
            />
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {latestProducts.map(product => {
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
                        <div
                          className={cn(
                            typography.cardMeta,
                            'absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-stone-600'
                          )}
                        >
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
                          <span className="bg-white/90 text-red-600 text-[11px] font-normal px-3 py-1 rounded-full">
                            Mavjud emas
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex flex-col flex-1 p-3 pt-2">
                      <Link to="/products/$slug" params={{ slug: product.slug }}>
                        <h3
                          className={cn(
                            typography.cardTitle,
                            'mb-1 group-hover:opacity-80 transition-opacity line-clamp-2'
                          )}
                        >
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center justify-between mt-auto">
                        <span className={typography.cardPrice}>
                          {displayPrice(product.calculatedPrice)}
                        </span>
                        {!product.inStock || product.availableStock <= 0 ? (
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
                              if (!isAuthenticated) {
                                navigate({ to: '/login' });
                                return;
                              }
                              addToCart.mutate({
                                productId: product.id,
                                quantity: 1,
                                regionCode: regionCode as string,
                              });
                            }}
                            disabled={addToCart.isPending}
                            className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center border ${
                              isInCart
                                ? 'bg-[#4A1525] border-[#4A1525] text-white'
                                : 'bg-white border-stone-200 text-[#4A1525] hover:border-[#4A1525] hover:text-[#4A1525]'
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
          )}
        </div>
      </div>
    </section>
  );
}
