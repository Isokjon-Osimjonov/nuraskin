import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Bell,
  BellOff,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProductBySlug } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';
import { useMyWaitlistIds, useToggleWaitlist } from '@/hooks/useWaitlist';
import { cn } from '@/lib/utils';
import { formatUzs, formatKrw, formatPrice } from '@nuraskin/shared-utils';
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
  const [activeImage, setActiveImage] = useState(0);

  const isOnWaitlist = waitlistIds.includes(product?.id || '');
  const isInCart = cartData?.items?.some(i => i.productId === product?.id);

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
        <Link to="/products" className="mt-4 text-stone-500 underline underline-offset-4">
          Katalogga qaytish
        </Link>
      </div>
    );
  }

  const handleWaitlistToggle = () => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }
    if (isOnWaitlist) {
      removeWaitlist.mutate(product.id);
    } else {
      addWaitlist.mutate(product.id);
    }
  };

  const displayPrice = (val: string) => formatPrice(val, regionCode as 'UZB' | 'KOR');

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 md:px-16 py-6 sm:py-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] text-stone-400 font-light mb-8 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
          <Link to="/" className="hover:text-[#4A1525] transition-colors">
            Bosh sahifa
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-[#4A1525] transition-colors">
            Katalog
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-stone-300">{product.categoryName}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#4A1525] truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-6">
          {/* LEFT: Image */}
          <div className="w-full">
            <div className="w-full aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center">
              <img
                src={product.imageUrls[activeImage] || ''}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.imageUrls.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.imageUrls.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                      activeImage === i ? 'border-[#4A1525]' : 'border-transparent'
                    )}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`${product.name} thumbnail ${i}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details */}
          <div className="w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[14px] text-stone-400 font-light tracking-wide mb-1 uppercase">
                  {product.brandName}
                </p>
                <h1 className="text-2xl md:text-3xl font-light text-[#4A1525] leading-tight">
                  {product.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-normal text-[#4A1525]">
                  {quantity >= product.minWholesaleQty
                    ? displayPrice(product.wholesalePrice)
                    : displayPrice(product.calculatedPrice)}
                </span>
                {quantity >= product.minWholesaleQty && (
                  <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Ulgurji narx!
                  </span>
                )}
                {regionCode === 'UZB' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-normal uppercase tracking-tight flex items-center gap-1 cursor-help">
                          Kargo ichida
                          <Info className="w-3 h-3" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[280px] text-[12px] leading-relaxed">
                        Narxga yetkazib berish va qadoqlash xarajati kiritilgan. Bir nechta
                        mahsulotni birga buyurtma qilsangiz, ular bitta qutida yuborilgani uchun narx
                        biroz arzonlashishi mumkin.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm text-stone-500">
                <p>1 ta: {displayPrice(product.calculatedPrice)}</p>
                {Number(product.wholesalePrice) > 0 && product.minWholesaleQty > 1 && (
                  <p>
                    {product.minWholesaleQty}+ ta: {displayPrice(product.wholesalePrice)} (ulgurji)
                  </p>
                )}
              </div>
            </div>

            {/* Stock Badge */}
            <div className="mb-4">
              {product.availableStock > 10 ? (
                <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                  MAVJUD
                </span>
              ) : product.availableStock > 0 ? (
                <span className="text-[11px] font-normal text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-100">
                  Kam qoldi: {product.availableStock} ta
                </span>
              ) : (
                <span className="text-[11px] font-normal text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100">
                  Tugadi
                </span>
              )}
            </div>

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
                    <span className="font-normal text-lg w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => {
                        const cartItem = cartData?.items?.find(i => i.productId === product.id);
                        const currentCartQty = cartItem ? cartItem.quantity : 0;
                        if (currentCartQty + quantity >= product.availableStock) {
                          toast.warning(`Maksimal: ${product.availableStock} ta`);
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
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#4A1525] text-white text-sm font-normal tracking-wide hover:opacity-90 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate({ to: '/login' });
                        return;
                      }
                      const cartItem = cartData?.items?.find(i => i.productId === product.id);
                      const currentCartQty = cartItem ? cartItem.quantity : 0;
                      if (currentCartQty + quantity > product.availableStock) {
                        toast.warning(
                          `Savatchada allaqachon ${currentCartQty} ta bor. Maksimal: ${product.availableStock} ta`
                        );
                        return;
                      }

                      addToCart.mutate({
                        productId: product.id,
                        quantity: quantity,
                        regionCode: regionCode as string,
                      });
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isInCart ? 'Savatchada bor' : "Savatchaga qo'shish"}
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
                      activeTab === tab
                        ? 'text-[#4A1525] font-normal'
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {tab === 'info' && "Ma'lumot"}
                    {tab === 'use' && "Qo'llash usuli"}
                    {tab === 'ingredients' && 'Tarkibi'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A1525]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="text-[14px] text-stone-500 font-light leading-relaxed min-h-[100px]">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <p>
                      {product.descriptionUz ||
                        "Mahsulot haqida batafsil ma'lumot tez orada qo'shiladi."}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {product.benefits.map((b, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-[#f8f7f5] text-stone-600 px-3 py-1 rounded-full"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'use' && (
                  <p>
                    {product.howToUseUz || "Qo'llash bo'yicha maxsus ko'rsatmalar mavjud emas."}
                  </p>
                )}
                {activeTab === 'ingredients' && (
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.length > 0
                      ? product.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="text-[12px] text-stone-500 bg-stone-50 border border-stone-100 px-3 py-1 rounded-md"
                          >
                            {ing}
                          </span>
                        ))
                      : "Tarkibi haqida ma'lumot mavjud emas."}
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
                  <h4 className="text-[12px] font-normal text-[#4A1525]">100% Original</h4>
                  <p className="text-[10px] text-stone-400 font-light">
                    Sertifikatlangan mahsulotlar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f8f7f5] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#4A1525]" strokeWidth={1.2} />
                </div>
                <div>
                  <h4 className="text-[12px] font-normal text-[#4A1525]">Koreyadan</h4>
                  <p className="text-[10px] text-stone-400 font-light">
                    To'g'ridan-to'g'ri yetkazib berish
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
