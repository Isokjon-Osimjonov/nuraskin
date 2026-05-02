import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Star, ChevronRight, Plus, Minus, ShoppingBag, ShieldCheck, Truck, Heart, Bell, BellOff, Info, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useProductBySlug } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlistIds, useToggleWaitlist } from '@/hooks/useWaitlist';
import { formatUzs, formatKrw } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart, useAddToCart } from '@/hooks/useCart';

export const Route = createFileRoute('/products/$slug')({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { favorites, toggleFavorite, isAuthenticated, regionCode } = useAppStore();
  const { data: waitlistIds = [] } = useMyWaitlistIds();
  const { add: addWaitlist, remove: removeWaitlist } = useToggleWaitlist();
  const navigate = useNavigate();

  const { data: productData, isLoading } = useProductBySlug(slug);
  const product = productData?.data;

  const { data: cartData } = useCart();
  const addToCart = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'use' | 'ingredients'>('info');

  const isOnWaitlist = waitlistIds.includes(product?.id || '');
  const isInCart = cartData?.items?.some((i) => i.productId === product?.id);

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen py-12 animate-pulse">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[4/5] bg-stone-100 rounded-3xl" />
          <div className="space-y-6">
            <div className="h-4 bg-stone-100 rounded w-1/4" />
            <div className="h-10 bg-stone-100 rounded w-3/4" />
            <div className="h-6 bg-stone-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-light text-[#4A1525]">Mahsulot topilmadi</h2>
        <Link to="/products" className="mt-4 text-stone-500 underline underline-offset-4">Katalogga qaytish</Link>
      </div>
    );
  }

  const handleWaitlistToggle = () => {
    if (!isAuthenticated) { navigate({ to: '/login' }); return; }
    if (isOnWaitlist) {
      removeWaitlist.mutate(product.id);
    } else {
      addWaitlist.mutate(product.id);
    }
  };

  const displayPrice = (val: string) => {
    if (regionCode === 'KOR') return formatKrw(val);
    return formatUzs(val);
  };

  const productForStore = {
    id: product.id,
    name: product.name,
    price: product.calculatedPrice,
    image: product.imageUrls[0] || '',
    slug: product.slug,
    stock: product.availableStock,
    availableStock: product.availableStock,
    showStockCount: product.showStockCount,
    currency: product.currency,
    wholesalePrice: product.wholesalePrice,
    minWholesaleQty: product.minWholesaleQty,
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-6 md:pt-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-stone-400 font-light mb-8 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
          <Link to="/" className="hover:text-[#4A1525] transition-colors">Bosh sahifa</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-[#4A1525] transition-colors">Katalog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-stone-300">{product.categoryName}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#4A1525] truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="max-h-[350px] md:max-h-[500px] aspect-[4/5] bg-stone-50 rounded-2xl overflow-hidden flex items-center justify-center p-4 md:p-8">
              <img
                src={product.imageUrls[0] || ''}
                alt={product.name}
                className="w-full h-full object-contain object-center"
              />
            </div>
            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.imageUrls.slice(1, 5).map((url, i) => (
                  <div key={i} className="aspect-square bg-stone-50 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity p-2">
                    <img src={url} alt={`${product.name} ${i + 2}`} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[14px] text-stone-400 font-light tracking-wide mb-1 uppercase">{product.brandName}</p>
                <h1 className="text-2xl md:text-3xl font-light text-[#4A1525] leading-tight">{product.name}</h1>
              </div>
              <button
                onClick={() => toggleFavorite(productForStore)}
                className={`p-2 rounded-full border border-stone-100 transition-colors ${
                  favorites.some(p => p.id === product.id) ? 'bg-[#4A1525] text-white border-[#4A1525]' : 'bg-white text-stone-300 hover:text-[#4A1525] hover:border-[#4A1525]'
                }`}
              >
                <Heart className="w-5 h-5" fill={favorites.some(p => p.id === product.id) ? "white" : "none"} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[12px] text-stone-400 font-light border-l border-stone-200 pl-3">24 sharhlar</span>
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-medium text-[#4A1525]">{displayPrice(product.calculatedPrice)}</span>
              {regionCode === 'UZB' && (
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium uppercase tracking-tight">Kargo ichida</span>
              )}
            </div>

            {/* Stock indicator */}
            {product.availableStock === 0 ? (
              <p className="text-[12px] text-red-600 mb-6 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Sotuvda tugagan
              </p>
            ) : product.showStockCount && product.availableStock <= 10 ? (
              <p className="text-[12px] text-orange-600 mb-6 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Faqat {product.availableStock} ta qoldi!
              </p>
            ) : (
              <p className="text-[12px] text-emerald-600 mb-6 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mavjud {product.showStockCount ? `(${product.availableStock} ta)` : ''}
              </p>
            )}

            {/* Add to Cart / Waitlist Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 pb-8 border-b border-stone-100">
              {product.availableStock > 0 ? (
                <>
                  <div className="flex items-center justify-between w-full sm:w-28 h-12 border border-stone-200 rounded-full px-4 bg-[#f8f7f5]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-lg w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => {
                        if (quantity >= product.availableStock) {
                          toast.error(`Faqat ${product.availableStock} ta mavjud!`);
                          return;
                        }
                        setQuantity(quantity + 1);
                      }}
                      className="text-stone-400 hover:text-[#4A1525] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    className={`flex-1 w-full h-12 font-light text-[14px] tracking-wide rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                      isInCart
                        ? 'bg-[#4A1525] text-white hover:bg-[#6B2540]'
                        : 'bg-white border border-stone-200 text-[#4A1525] hover:border-[#4A1525]'
                    }`}
                    onClick={() => {
                      if (!isAuthenticated) { navigate({ to: '/login' }); return; }
                      addToCart.mutate({
                        productId: product.id,
                        quantity: quantity,
                        regionCode: regionCode as string,
                      });
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isInCart ? 'Savatchada bor' : 'Savatchaga qo\'shish'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleWaitlistToggle}
                  disabled={addWaitlist.isPending || removeWaitlist.isPending}
                  className={`w-full h-12 flex items-center justify-center gap-2 px-8 rounded-full text-[14px] font-light transition-all duration-200 disabled:opacity-50 ${
                    isOnWaitlist
                      ? 'bg-[#4A1525] text-white hover:bg-[#6B2540]'
                      : 'bg-[#f8f7f5] text-stone-600 border border-stone-200 hover:border-[#4A1525] hover:text-[#4A1525]'
                  }`}
                >
                  {isOnWaitlist ? (
                    <>
                      <BellOff className="w-4 h-4" />
                      Xabarnomani bekor qilish
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Mavjud bo'lganda xabardor qiling
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Product Tabs */}
            <div className="space-y-6">
              <div className="flex gap-8 border-b border-stone-100">
                {(['info', 'use', 'ingredients'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-[13px] font-light tracking-wide transition-all relative ${
                      activeTab === tab ? 'text-[#4A1525] font-normal' : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {tab === 'info' && 'Ma\'lumot'}
                    {tab === 'use' && 'Qo\'llash usuli'}
                    {tab === 'ingredients' && 'Tarkibi'}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A1525]" />}
                  </button>
                ))}
              </div>

              <div className="text-[14px] text-stone-500 font-light leading-relaxed min-h-[100px]">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <p>{product.descriptionUz || 'Mahsulot haqida batafsil ma\'lumot tez orada qo\'shiladi.'}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {product.benefits.map((b, i) => (
                        <span key={i} className="text-[11px] bg-[#f8f7f5] text-stone-600 px-3 py-1 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'use' && (
                   <p>{product.howToUseUz || 'Qo\'llash bo\'yicha maxsus ko\'rsatmalar mavjud emas.'}</p>
                )}
                {activeTab === 'ingredients' && (
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.length > 0 ? (
                      product.ingredients.map((ing, i) => (
                        <span key={i} className="text-[12px] text-stone-500 bg-stone-50 border border-stone-100 px-3 py-1 rounded-md">{ing}</span>
                      ))
                    ) : (
                      'Tarkibi haqida ma\'lumot mavjud emas.'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f8f7f5] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#4A1525]" strokeWidth={1.2} />
                </div>
                <div>
                  <h4 className="text-[12px] font-medium text-[#4A1525]">100% Original</h4>
                  <p className="text-[10px] text-stone-400 font-light">Sertifikatlangan mahsulotlar</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f8f7f5] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#4A1525]" strokeWidth={1.2} />
                </div>
                <div>
                  <h4 className="text-[12px] font-medium text-[#4A1525]">Koreyadan</h4>
                  <p className="text-[10px] text-stone-400 font-light">To'g'ridan-to'g'ri yetkazib berish</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
