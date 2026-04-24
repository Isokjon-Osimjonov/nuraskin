import { useState, useRef, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';
import { createOrder, submitReceipt } from '@/api/orders';
import { apiFetch } from '@/lib/apiFetch';
import { getCheckoutCoupons } from '@/api/gamification';
import type { CheckoutCoupon, CouponValidation } from '@/api/gamification';
import { ArrowLeft, Camera, Send, Check, Loader2, Ticket, X, AlertCircle, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import type { CreateOrderPayload } from '@/api/orders';

export const Route = createFileRoute('/_protected/checkout')({
  component: CheckoutPage,
});

type CheckoutStep = 'address' | 'payment' | 'receipt' | 'done';

const formatPrice = (price: number) => new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';

interface StoreSettings {
  shippingFee?: number;
  freeShippingThreshold?: number;
  minOrderAmount?: number;
  paymentCardNumber?: string;
  paymentCardHolder?: string;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart, isAuthenticated, user, addresses } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<CheckoutStep>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderShortId, setOrderShortId] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showCouponBrowser, setShowCouponBrowser] = useState(false);

  // Address form
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
  const [fullName, setFullName] = useState(defaultAddr?.fullName || user?.name || '');
  const [phone, setPhone] = useState(defaultAddr?.phone || '');
  const [address, setAddress] = useState(defaultAddr?.street || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Toshkent');
  const [region, setRegion] = useState('Toshkent');

  // Fetch store settings
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiFetch<{ success: boolean; data: StoreSettings }>('/settings/public'),
  });

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
    if (cart.length === 0 && !orderId) navigate({ to: '/cart' });
  }, [isAuthenticated, cart.length, navigate, orderId]);

  const settings = settingsData?.data || {};
  const shippingFee = settings.shippingFee ?? 35000;
  const freeThreshold = settings.freeShippingThreshold ?? 500000;
  const minOrder = settings.minOrderAmount ?? 0;

  const productIds = cart.map((i) => i.product.id);
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : shippingFee;
  const discount = couponApplied?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const belowMin = minOrder > 0 && subtotal < minOrder;

  const { data: checkoutCouponsData } = useQuery({
    queryKey: ['checkout-coupons', productIds.join(','), subtotal],
    queryFn: () => getCheckoutCoupons(productIds, subtotal),
    enabled: isAuthenticated && cart.length > 0,
    staleTime: 30_000,
  });

  const checkoutCoupons: CheckoutCoupon[] = checkoutCouponsData?.data ?? [];

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponError('');
    setIsValidating(true);
    try {
      const res = await apiFetch<{ success: boolean; data: CouponValidation; error?: string }>(
        '/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            code: couponCode.trim().toUpperCase(),
            purchaseAmount: subtotal,
            productIds: cart.map((i) => i.product.id),
            cartItems: cart.map((i) => ({
              productId: i.product.id,
              price: i.product.price,
              quantity: i.quantity,
            })),
          }),
        }
      );
      if (res.success && res.data) {
        setCouponApplied(res.data);
        setCouponError('');
      } else {
        setCouponError(res.error || 'Kupon topilmadi');
        setCouponApplied(null);
      }
    } catch {
      setCouponError('Kuponni tekshirib bo\'lmadi');
      setCouponApplied(null);
    } finally {
      setIsValidating(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  }

  async function handleSelectCouponFromBrowser(coupon: CheckoutCoupon) {
    if (!coupon.applicable) return;
    setCouponCode(coupon.code);
    setCouponError('');
    setIsValidating(true);
    setShowCouponBrowser(false);
    try {
      const res = await apiFetch<{ success: boolean; data: CouponValidation; error?: string }>(
        '/coupons/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            code: coupon.code,
            purchaseAmount: subtotal,
            productIds,
            cartItems: cart.map((i) => ({
              productId: i.product.id,
              price: i.product.price,
              quantity: i.quantity,
            })),
          }),
        }
      );
      if (res.success && res.data) {
        setCouponApplied(res.data);
        setCouponError('');
      } else {
        setCouponError(res.error || 'Kupon topilmadi');
        setCouponApplied(null);
      }
    } catch {
      setCouponError('Kuponni tekshirib bo\'lmadi');
      setCouponApplied(null);
    } finally {
      setIsValidating(false);
    }
  }

  async function handlePlaceOrder() {
    if (!fullName || !phone || !address) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }
    if (belowMin) {
      setError(`Minimal buyurtma miqdori: ${formatPrice(minOrder)}`);
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const payload: CreateOrderPayload = {
        items: cart.map((i) => ({
          product: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
        })),
        paymentMethod: 'manual_transfer',
        shippingAddress: { fullName, phone, address, city, region },
        couponCode: couponApplied?.couponCode,
      };

      const res = await createOrder(payload);
      if (res.success && res.data) {
        setOrderId(res.data._id);
        setOrderShortId(res.data.shortId || res.data.orderNumber);
        setOrderTotal(res.data.finalAmount || res.data.totalAmount);
        clearCart();
        setStep('payment');
      } else {
        setError('Buyurtma yaratishda xatolik');
      }
    } catch (err: unknown) {
      // ApiError from apiFetch includes the response body
      const body = (err as { body?: { error?: string } })?.body;
      const message = body?.error || (err instanceof Error ? err.message : '');
      setError(message || 'Server bilan bog\'lanib bo\'lmadi');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReceiptSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmitReceipt() {
    if (!receiptFile || !orderId) return;
    setIsUploading(true);
    try {
      await submitReceipt(orderId, receiptFile);
      setStep('done');
    } catch {
      setError('Chek yuborishda xatolik');
    } finally {
      setIsUploading(false);
    }
  }

  const telegramBotUsername = 'nuraskin_bot';

  return (
    <div className="min-h-[80vh] py-10 px-5 bg-white">
      <div className="max-w-[520px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate({ to: -1 as any })} className="text-stone-400 hover:text-stone-700 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-light text-[#4A1525]">
            {step === 'address' && 'Buyurtma rasmiylashtirish'}
            {step === 'payment' && "To'lov ma'lumotlari"}
            {step === 'receipt' && 'Chek yuborish'}
            {step === 'done' && 'Tayyor!'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-[12px] rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            {error}
          </div>
        )}

        {/* Step 1: Address + Summary */}
        {step === 'address' && (
          <div className="space-y-4">
            {/* Shipping Address Form */}
            <div className="bg-[#f8f7f5] rounded-xl p-5 space-y-3">
              <h3 className="text-[13px] font-light text-stone-800">Yetkazib berish manzili</h3>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="To'liq ism"
                className="w-full h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4A1525]/20"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon raqam"
                type="tel"
                className="w-full h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4A1525]/20"
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Manzil (ko'cha, uy, kvartira)"
                className="w-full h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4A1525]/20"
              />
              <div className="flex gap-2.5">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Shahar"
                  className="flex-1 h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4A1525]/20"
                />
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Viloyat"
                  className="flex-1 h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4A1525]/20"
                />
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-[#f8f7f5] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-light text-stone-800 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[#4A1525]" strokeWidth={1.5} />
                  Kupon kodi
                </h3>
                {checkoutCoupons.length > 0 && !couponApplied && (
                  <button
                    type="button"
                    onClick={() => setShowCouponBrowser((v) => !v)}
                    className="flex items-center gap-1 text-[11px] text-[#4A1525] font-medium hover:underline"
                  >
                    Kuponlarim ({checkoutCoupons.filter((c) => c.applicable).length})
                    {showCouponBrowser ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Coupon browser */}
              {showCouponBrowser && checkoutCoupons.length > 0 && (
                <div className="mb-3 space-y-2">
                  {checkoutCoupons.map((coupon) => {
                    const discountLabel =
                      coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% chegirma`
                        : `${formatPrice(coupon.discountValue)} chegirma`;
                    return (
                      <button
                        key={coupon._id}
                        type="button"
                        onClick={() => handleSelectCouponFromBrowser(coupon)}
                        disabled={!coupon.applicable}
                        className={`w-full text-left flex items-start gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                          coupon.applicable
                            ? 'border-[#4A1525]/20 bg-white hover:border-[#4A1525] hover:shadow-sm cursor-pointer'
                            : 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Tag className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${coupon.applicable ? 'text-[#4A1525]' : 'text-stone-400'}`} strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-stone-800">{coupon.code}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${coupon.applicable ? 'bg-[#4A1525]/10 text-[#4A1525]' : 'bg-stone-200 text-stone-500'}`}>
                              {discountLabel}
                            </span>
                          </div>
                          {coupon.applicable ? (
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              {coupon.minimumPurchaseAmount > 0 && (
                                <span>Minimal: {formatPrice(coupon.minimumPurchaseAmount)} · </span>
                              )}
                              {coupon.targetCategories && coupon.targetCategories.length > 0 && (
                                <span>{coupon.targetCategories.map((c) => c.name).join(', ')} · </span>
                              )}
                              <span>Tugaydi: {new Date(coupon.expiresAt).toLocaleDateString('uz-UZ')}</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-red-400 mt-0.5">{coupon.inapplicableReason}</p>
                          )}
                        </div>
                        {coupon.applicable && (
                          <span className="text-[10px] text-[#4A1525] font-medium shrink-0 self-center">Tanlash</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {couponApplied ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-emerald-700 font-mono">{couponApplied.couponCode}</p>
                    <p className="text-[11px] text-emerald-600">
                      {couponApplied.discountType === 'percentage'
                        ? `${couponApplied.discountValue}% chegirma`
                        : `${formatPrice(couponApplied.discountAmount)} chegirma`}
                    </p>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-emerald-400 hover:text-emerald-600">
                    <X className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                    placeholder="Kodni kiriting"
                    className="flex-1 h-10 px-3.5 rounded-lg border border-stone-200 bg-white text-[13px] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#4A1525]/20"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isValidating}
                    className="h-10 px-4 rounded-lg bg-[#4A1525] text-white text-[12px] font-medium hover:bg-[#3a1020] transition-colors disabled:opacity-40 shrink-0"
                  >
                    {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Qo\'llash'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-red-500 mt-2">{couponError}</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-[#f8f7f5] rounded-xl p-5">
              <h3 className="text-[13px] font-light text-stone-800 mb-3">Buyurtma xulosasi</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-[12px]">
                    <span className="text-stone-600 truncate mr-2">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-200 mt-3 pt-3 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-stone-500">Mahsulotlar</span>
                  <span className="text-stone-700">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-stone-500">
                    Yetkazib berish
                    {freeThreshold > 0 && subtotal < freeThreshold && (
                      <span className="text-stone-400"> ({formatPrice(freeThreshold)} dan bepul)</span>
                    )}
                  </span>
                  <span className={shipping === 0 ? 'text-emerald-600 font-medium' : 'text-stone-700'}>
                    {shipping === 0 ? 'Bepul' : formatPrice(shipping)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="text-emerald-600">Chegirma</span>
                    <span className="text-emerald-600 font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px] font-semibold text-[#4A1525] pt-1.5 border-t border-stone-200 mt-1.5">
                  <span>Jami</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Min order warning */}
            {belowMin && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.5} />
                <p className="text-[12px] text-amber-700">
                  Minimal buyurtma miqdori: <span className="font-medium">{formatPrice(minOrder)}</span>
                </p>
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || belowMin}
              className="w-full h-11 rounded-full bg-[#4A1525] text-white text-[13px] font-medium tracking-wide hover:bg-[#3a1020] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Buyurtma berilmoqda...</>
              ) : (
                `Buyurtma berish · ${formatPrice(total)}`
              )}
            </button>
          </div>
        )}

        {/* Step 2: Payment Info */}
        {step === 'payment' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-stone-800">Buyurtma qabul qilindi!</p>
              <p className="text-[12px] text-stone-500 mt-0.5">#{orderShortId}</p>
            </div>

            <div className="bg-[#f8f7f5] rounded-xl p-5 space-y-2.5">
              <h3 className="text-[13px] font-light text-stone-800 mb-1">Karta ma'lumotlari</h3>
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">Karta:</span>
                <span className="font-mono font-medium">{(settings as Record<string, unknown>).paymentCardNumber as string || '8600 **** **** ****'}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-stone-500">Egasi:</span>
                <span className="font-medium">{(settings as Record<string, unknown>).paymentCardHolder as string || 'NuraSkin'}</span>
              </div>
              <div className="flex justify-between text-[13px] pt-2 border-t border-stone-200">
                <span className="text-stone-500">To'lov miqdori:</span>
                <span className="font-bold text-[#4A1525]">{formatPrice(orderTotal)}</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 text-center px-4">
              Yuqoridagi kartaga pul o'tkazing va chek rasmini yuboring
            </p>

            <button
              onClick={() => setStep('receipt')}
              className="w-full h-11 rounded-full bg-[#4A1525] text-white text-[13px] font-medium tracking-wide hover:bg-[#3a1020] transition-colors"
            >
              Chek yuborish
            </button>

            {telegramBotUsername && (
              <>
                <div className="text-center text-[11px] text-stone-400">yoki</div>
                <button
                  onClick={() => window.open(`https://t.me/${telegramBotUsername}`, '_blank')}
                  className="w-full h-11 rounded-full border border-stone-200 text-stone-700 text-[13px] font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Telegram orqali yuborish
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Receipt Upload */}
        {step === 'receipt' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#4A1525]/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {receiptPreview ? (
                <img src={receiptPreview} className="max-h-44 mx-auto rounded-lg" alt="Receipt preview" />
              ) : (
                <div className="space-y-2">
                  <Camera className="w-9 h-9 mx-auto text-stone-300" strokeWidth={1.2} />
                  <p className="text-[12px] text-stone-500">Chek rasmini tanlang yoki suratga oling</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptSelect}
              />
            </div>

            <button
              onClick={handleSubmitReceipt}
              disabled={!receiptFile || isUploading}
              className="w-full h-11 rounded-full bg-[#4A1525] text-white text-[13px] font-medium tracking-wide hover:bg-[#3a1020] transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...</>
              ) : (
                'Chekni yuborish'
              )}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-light text-[#4A1525] mb-1">Chekingiz qabul qilindi!</h2>
              <p className="text-[12px] text-stone-500">
                Tez orada tekshirib, buyurtmangizni tayyorlaymiz
              </p>
            </div>
            <button
              onClick={() => navigate({ to: '/orders' })}
              className="w-full h-11 rounded-full bg-[#4A1525] text-white text-[13px] font-medium tracking-wide hover:bg-[#3a1020] transition-colors"
            >
              Buyurtmalarimga o'tish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}