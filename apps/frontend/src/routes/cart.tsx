import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Trash2, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { apiFetch } from '@/lib/apiFetch';

interface StoreSettings {
  shippingFee?: number;
  freeShippingThreshold?: number;
  minOrderAmount?: number;
}

export const Route = createFileRoute('/cart')({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart } = useAppStore();

  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiFetch<{ success: boolean; data: StoreSettings }>('/settings/public'),
  });

  const settings = settingsData?.data || {};
  const shippingFee = settings.shippingFee ?? 35000;
  const freeThreshold = settings.freeShippingThreshold ?? 500000;

  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingFee;
  const total = subtotal + (cart.length > 0 ? shipping : 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

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
                <button onClick={clearCart} className="text-[12px] font-light text-red-500 hover:text-red-600 tracking-wide">
                  Barchasini tozalash
                </button>
              </div>

              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-5 py-4 border-b border-stone-200/50 last:border-0 last:pb-0">

                    {/* Image */}
                    <Link to="/products/$slug" params={{ slug: item.product.slug }} className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-white overflow-hidden shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-2">
                        <Link to="/products/$slug" params={{ slug: item.product.slug }} className="hover:opacity-70 transition-opacity pr-4">
                          <h3 className="text-[14px] font-light text-[#4A1525] leading-tight">{item.product.name}</h3>
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-[13px] font-light text-stone-500 mb-3">
                        {formatPrice(item.product.price)}
                      </div>

                      <div className="flex items-center justify-between w-full">
                        {/* Quantity */}
                        <div className="flex items-center justify-between w-24 h-9 border border-stone-200 rounded-full px-3 bg-white">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[13px] font-medium text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const maxStock = item.product.stock ?? 0;
                              if (maxStock > 0 && item.quantity >= maxStock) return;
                              updateQuantity(item.product.id, item.quantity + 1);
                            }}
                            className="text-stone-400 hover:text-[#4A1525] transition-colors disabled:opacity-50"
                            disabled={item.product.stock != null && item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[14px] font-medium text-[#4A1525]">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                      {item.product.stock != null && item.quantity >= item.product.stock && (
                        <p className="text-[11px] text-orange-600 mt-1">Omborda faqat {item.product.stock} ta mavjud</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="flex justify-between items-center text-white/70 text-[13px] font-light">
                  <span>Yetkazib berish:</span>
                  <span>{shipping === 0 ? 'Bepul' : formatPrice(shipping)}</span>
                </div>

                {shipping > 0 && freeThreshold > 0 && subtotal < freeThreshold && (
                  <div className="text-[11px] text-white/50 text-right font-light mt-1">
                    Yana {formatPrice(freeThreshold - subtotal)} lik mahsulot qo'shing va bepul yetkazib berishga ega bo'ling.
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
                className="w-full h-12 rounded-full bg-white text-[#4A1525] text-[13px] font-light tracking-wide hover:bg-stone-100 transition-colors flex items-center justify-center gap-2 group"
                onClick={() => navigate({ to: '/checkout' })}
              >
                Buyurtmani rasmiylashtirish
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