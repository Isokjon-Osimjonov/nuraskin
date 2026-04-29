import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Trash2, ArrowRight, ShieldCheck, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { apiFetch } from '@/lib/apiFetch';
import { formatUzs, formatKrw } from '@/lib/utils';
import type { KorShippingTierResponse, StorefrontSettings } from '@nuraskin/shared-types';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useCart';

export const Route = createFileRoute('/cart')({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { regionCode, isAuthenticated } = useAppStore();
  
  const { data: cartData, isLoading: isCartLoading } = useCart();
  const updateQty = useUpdateCartItem();
  const removeItems = useRemoveCartItem();
  const clearCart = useClearCart();

  const { data: settings } = useQuery({
    queryKey: ['storefront-settings'],
    queryFn: () => apiFetch<StorefrontSettings>('/storefront/settings'),
  });

  const { data: shippingTiers = [] } = useQuery({
    queryKey: ['shipping-tiers'],
    queryFn: () => apiFetch<KorShippingTierResponse[]>('/storefront/shipping-tiers'),
    enabled: regionCode === 'KOR',
  });

  const cart = cartData?.items ?? [];

  const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  
  let shipping = 0;
  if (regionCode === 'KOR') {
    const matchedTier = shippingTiers.find(t => t.maxOrderKrw === null || subtotal < Number(BigInt(t.maxOrderKrw)));
    shipping = matchedTier ? Number(BigInt(matchedTier.cargoFeeKrw)) : 0;
  }

  const total = subtotal + shipping;

  const hasStockError = cart.some(item => item.quantity > (item.availableStock ?? 999));

  const formatPrice = (val: number | string) => {
    if (regionCode === 'KOR') return formatKrw(val);
    return formatUzs(val);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-6">
        <h1 className="text-2xl font-medium text-[#4A1525] mb-3">Savatchani ko'rish uchun kiring</h1>
        <Link
          to="/login"
          className="bg-[#4A1525] text-white text-[13px] font-light tracking-wide px-7 py-3 rounded-full hover:bg-[#6B2540] transition-colors"
        >
          Kirish
        </Link>
      </div>
    );
  }

  if (isCartLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Yuklanmoqda...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-24 px-6">
        <div className="w-24 h-24 bg-[#4A1525]/5 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-[#4A1525]/30" />
        </div>
        <h1 className="text-2xl font-medium text-[#4A1525] mb-3">Savatchangiz bo'sh</h1>
        <p className="text-[14px] font-light text-stone-500 mb-8 max-w-md text-center">
          Siz hozircha hech qanday mahsulot tanlamadingiz. Katalogga o'tib, teriningiz uchun eng yaxshi variantlarni kashf eting.
        </p>
        <Link
          to="/products"
          className="bg-[#4A1525] text-white text-[13px] font-light tracking-wide px-7 py-3 rounded-full hover:bg-[#6B2540] transition-colors"
        >
          Katalogga o'tish
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-[1280px] mx-auto px-6">
        <h1 className="text-2xl font-light text-[#4A1525] mb-10">Savatcha</h1>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Cart Items List */}
          <div className="w-full lg:w-2/3">
            <div className="bg-[#f8f7f5] rounded-2xl p-5 md:p-8">
              <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-6">
                <span className="text-[13px] font-light text-stone-500">{cart.length} ta mahsulot</span>
                <button onClick={() => clearCart.mutate()} className="text-[12px] font-light text-red-500 hover:text-red-600 tracking-wide">
                  Barchasini tozalash
                </button>
              </div>

              <div className="space-y-5">
                {cart.map((item) => {
                  const isOverStock = item.quantity > (item.availableStock ?? 999);
                  const isWholesale = item.quantity >= (item.minWholesaleQty || 5);

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-5 py-4 border-b border-stone-200/50 last:border-0 last:pb-0">

                      {/* Image */}
                      <Link to="/products/$slug" params={{ slug: item.slug }} className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-white overflow-hidden shrink-0">
                        <img src={item.imageUrls[0]} alt={item.productName} className="w-full h-full object-cover" />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2">
                          <Link to="/products/$slug" params={{ slug: item.slug }} className="hover:opacity-70 transition-opacity pr-4">
                            <h3 className="text-[14px] font-light text-[#4A1525] leading-tight">{item.productName}</h3>
                          </Link>
                          <button
                            onClick={() => removeItems.mutate(item.id)}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                            aria-label="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-[13px] font-light text-stone-500 mb-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={isWholesale ? 'text-emerald-600 font-medium' : ''}>
                              {formatPrice(item.price)}
                            </span>
                            {isWholesale && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter font-bold italic">Ulgurji</span>
                            )}
                          </div>
                          {isOverStock && (
                            <div className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Faqat {item.availableStock} ta mavjud
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between w-full">
                          {/* Quantity */}
                          <div className={`flex items-center justify-between w-24 h-9 border rounded-full px-3 bg-white ${isOverStock ? 'border-red-300 ring-1 ring-red-100' : 'border-stone-200'}`}>
                            <button
                              onClick={() => updateQty.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                              className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1 || updateQty.isPending}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`text-[13px] font-medium text-center ${isOverStock ? 'text-red-600' : ''}`}>{item.quantity}</span>
                            <button
                              onClick={() => {
                                updateQty.mutate({ id: item.id, quantity: item.quantity + 1 });
                              }}
                              className="text-stone-400 hover:text-[#4A1525] transition-colors"
                              disabled={updateQty.isPending}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-[14px] font-medium text-[#4A1525]">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {regionCode === 'UZB' && (
                <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-emerald-700 leading-relaxed font-light">
                    <b>Yetkazib berish narxi mahsulot narxiga kiritilgan.</b> Siz alohida kargo uchun to'lov qilmaysiz.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-[#4A1525] text-white rounded-2xl p-7 sticky top-24">
              <h2 className="text-lg font-light text-white mb-6 border-b border-white/20 pb-4">
                Buyurtma xulosasi
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-white/70 text-[13px] font-light">
                  <span>Mahsulotlar ({cart.length}):</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {regionCode === 'KOR' && (
                  <div className="flex justify-between items-center text-white/70 text-[13px] font-light">
                    <span>Yetkazib berish:</span>
                    <span>{shipping === 0 ? 'Bepul' : formatPrice(shipping)}</span>
                  </div>
                )}
                
                {regionCode === 'UZB' && (
                  <div className="flex justify-between items-center text-white/70 text-[13px] font-light">
                    <span>Kargo (kiritilgan):</span>
                    <span className="text-emerald-400 font-medium">BEPUL ✓</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/20 pt-5 mb-6">
                <span className="text-[14px] font-light">Jami:</span>
                <span className="text-2xl font-medium tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                className="w-full h-12 rounded-full bg-white text-[#4A1525] text-[13px] font-light tracking-wide hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => navigate({ to: '/checkout' })}
                disabled={hasStockError}
              >
                {hasStockError ? 'Zaxira yetarli emas' : 'Buyurtmani rasmiylashtirish'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[12px] font-light text-stone-500">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>To'lov xavfsizligi ta'minlangan</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
