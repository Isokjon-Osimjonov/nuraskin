import { useState, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Search, SlidersHorizontal, X, ShoppingBag, Heart, Bell, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlistIds, useToggleWaitlist } from '@/hooks/useWaitlist';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart, useAddToCart } from '@/hooks/useCart';

export const Route = createFileRoute('/products/')({
  component: CategoryPage,
});

function CategoryPage() {
  const { favorites, toggleFavorite, isAuthenticated, regionCode } = useAppStore();
  const { data: waitlistIds = [] } = useMyWaitlistIds();
  const { add: addWaitlist, remove: removeWaitlist } = useToggleWaitlist();
  const navigate = useNavigate();
  
  const { data: cartData } = useCart();
  const addToCart = useAddToCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'arzon' | 'qimmat' | 'yangi'>('yangi');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data ?? [];

  const sortMap: Record<string, string> = {
    yangi: '-createdAt',
    arzon: 'calculatedPrice',
    qimmat: '-calculatedPrice',
  };

  const { data: productsData, isLoading } = useProducts({
    search: searchQuery || undefined,
    sort: sortMap[sortOrder],
    limit: 50,
  });

  const allProducts = productsData?.data ?? [];

  // Extract unique brands from loaded products for filter options
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    allProducts.forEach((p) => { if (p.brandName) brands.add(p.brandName); });
    return Array.from(brands).sort();
  }, [allProducts]);

  // Client-side filtering for brands
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (selectedBrands.length > 0 && (!product.brandName || !selectedBrands.includes(product.brandName))) return false;
      return true;
    });
  }, [allProducts, selectedBrands]);

  const displayPrice = (val: string) =>
    formatPrice(val, regionCode as 'UZB' | 'KOR');

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]);
  };

  const categoryName = 'Barcha mahsulotlar';

  const renderFilterSidebar = () => (
    <div className="space-y-8">
      {/* Category list */}
      <div>
        <h3 className="text-[14px] font-light text-[#4A1525] mb-4">Kategoriyalar</h3>
        <div className="space-y-2">
          <Link
            to="/products"
            className="block text-[13px] font-medium text-[#4A1525] transition-colors"
          >
            Barchasi
          </Link>
          {((categories as any)?.data || categories || []).filter((c: any) => c.isActive).map((cat: any) => (
            <Link
              key={cat.id}
              to="/products"
              search={{ category: cat.slug }}
              className="block text-[13px] font-light text-stone-500 hover:text-[#4A1525] transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {availableBrands.length > 0 && (
        <div>
          <h3 className="text-[14px] font-light text-[#4A1525] mb-4">Brend</h3>
          <div className="space-y-2">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="rounded border-stone-300 text-[#4A1525] focus:ring-inset focus:ring-[#4A1525] h-4 w-4 accent-[#4A1525]"
                />
                <span className="text-[13px] font-light text-stone-500 group-hover:text-stone-700 transition-colors">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-24 pt-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 border-b border-stone-100 pb-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-light text-[#4A1525]">{categoryName}</h1>
        <p className="text-[13px] font-light text-stone-500 mt-2">
          {filteredProducts.length} mahsulot topildi
        </p>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-1/4 shrink-0">
          {renderFilterSidebar()}
        </aside>

        {/* Mobile Filters trigger */}
        <div className="md:hidden w-full flex justify-between items-center mb-4">
          <button
            className="flex items-center gap-2 border border-stone-200 text-stone-600 text-[13px] font-light px-4 py-2 rounded-full hover:border-[#4A1525] hover:text-[#4A1525] transition-colors"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtrlar
          </button>
          <div className="text-[12px] font-light text-stone-400">{filteredProducts.length} mahsulot</div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
              <input
                placeholder="Qidirish..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#f8f7f5] border border-stone-200 text-[13px] font-light outline-none focus:border-[#4A1525] transition-colors placeholder:text-stone-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[12px] font-light text-stone-400 whitespace-nowrap hidden sm:inline-block">Saralash:</span>
              <select
                className="w-full sm:w-auto h-10 rounded-full border border-stone-200 bg-[#f8f7f5] px-4 py-1 text-[13px] font-light focus:outline-none focus:border-[#4A1525]"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'arzon' | 'qimmat' | 'yangi')}
              >
                <option value="yangi">Eng yangilari</option>
                <option value="arzon">Arzon → Qimmat</option>
                <option value="qimmat">Qimmat → Arzon</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[#f8f7f5] rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-[200px] bg-stone-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-4 bg-stone-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {!isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredProducts.map((product) => {
                const isOnWaitlist = waitlistIds.includes(product.id);
                const isInCart = cartData?.items?.some((i: any) => i.productId === product.id);
                return (
                <div key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-xl transition-all duration-300">
                  <Link to="/products/$slug" params={{ slug: product.slug }} className="block relative h-[200px] w-full overflow-hidden bg-stone-100 p-2">
                    <img
                      src={product.imageUrls[0] || ''}
                      alt={product.name}
                      className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    
                    {product.availableStock === 0 && (
                      <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center backdrop-blur-[2px] transition-all duration-500">
                        <span className="text-white text-[10px] font-bold tracking-widest uppercase">Tez orada keladi</span>
                      </div>
                    )}
                    {product.showStockCount && product.availableStock > 0 && product.availableStock <= 5 && (
                      <div className="absolute bottom-3 left-3 bg-orange-500/90 text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                        Faqat {product.availableStock} ta
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-col flex-1 p-3">
                    <div className="flex flex-col mb-2">
                       <span className="text-[10px] text-stone-400 uppercase tracking-tight">{product.categoryName}</span>
                       {product.brandName && (
                        <span className="text-[10px] text-stone-400 font-light">{product.brandName}</span>
                       )}
                    </div>
                    
                    <Link to="/products/$slug" params={{ slug: product.slug }}>
                      <h3 className="text-sm font-medium text-[#4A1525] leading-snug mb-3 group-hover:text-[#6B2540] transition-colors truncate">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#4A1525]">
                        {displayPrice(product.calculatedPrice)}
                      </span>
                      {product.availableStock === 0 ? (
                        <button
                          aria-label="Xabardor qiling"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) { navigate({ to: '/login' }); return; }
                            if (isOnWaitlist) {
                              removeWaitlist.mutate(product.id);
                            } else {
                              addWaitlist.mutate(product.id);
                            }
                          }}
                          disabled={addWaitlist.isPending || removeWaitlist.isPending}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border ${
                            isOnWaitlist
                              ? 'bg-[#4A1525] text-white border-[#4A1525]'
                              : 'bg-white text-stone-400 border-stone-200 hover:border-[#4A1525] hover:text-[#4A1525]'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${isOnWaitlist ? 'fill-current' : ''}`} strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) { navigate({ to: '/login' }); return; }
                            addToCart.mutate({
                              productId: product.id,
                              quantity: 1,
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

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <h3 className="text-lg font-medium text-stone-400 mb-2">Hech narsa topilmadi</h3>
                  <p className="text-[13px] font-light text-stone-400">Qidiruv yoki filtrlaringizni o'zgartirib ko'ring.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedBrands([]); }}
                    className="mt-6 border border-stone-300 text-stone-700 text-[13px] font-light px-6 py-2.5 rounded-full hover:border-[#4A1525] hover:text-[#4A1525] transition-colors"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end">
          <div className="w-[85%] max-sm h-full bg-white flex flex-col">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-[16px] font-medium text-[#4A1525]">Filtrlar</h2>
              <button className="text-stone-400 hover:text-stone-700 transition-colors" onClick={() => setIsMobileFiltersOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {renderFilterSidebar()}
            </div>
            <div className="p-5 border-t border-stone-100 flex gap-3">
              <button
                className="flex-1 border border-stone-300 text-stone-700 text-[13px] font-light py-2.5 rounded-full hover:border-[#4A1525] hover:text-[#4A1525] transition-colors"
                onClick={() => { setSelectedBrands([]); }}
              >
                Tozalash
              </button>
              <button
                className="flex-1 bg-[#4A1525] text-white text-[13px] font-light py-2.5 rounded-full hover:bg-[#6B2540] transition-colors"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                Qo'llash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
