import { useState, useMemo } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ShoppingBag, MapPin, Phone, User, CreditCard, ArrowLeft, Loader2, Ticket, XCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { createStorefrontOrderSchema, StorefrontOrderResponse } from '@nuraskin/shared-types';
import { formatUzs, formatKrw } from '@/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/checkout')({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { regionCode } = useAppStore();
  const navigate = useNavigate();
  const { data: cartData, isLoading: isCartLoading } = useCart();
  const createOrder = useCreateOrder();
  const validateCoupon = useValidateCoupon();

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');

  const cart = cartData?.items ?? [];
  const isEmpty = cart.length === 0;

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + BigInt(item.price) * BigInt(item.quantity), 0n);
  }, [cart]);

  // Handle tiered Korea cargo
  const korCargo = useMemo(() => {
    if (regionCode !== 'KOR') return 0n;
    if (subtotal >= 100000n) return 0n; // Dummy tier
    return 4000n;
  }, [subtotal, regionCode]);

  const totalBeforeDiscount = subtotal + korCargo;
  const discountAmount = appliedCoupon?.valid ? BigInt(appliedCoupon.discountAmount) : 0n;
  const finalTotal = totalBeforeDiscount - discountAmount;

  const form = useForm<any>({
    resolver: zodResolver(createStorefrontOrderSchema as any),
    defaultValues: {
      items: [],
      regionCode,
      fullName: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      couponCode: '',
    },
  });

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    
    const cartItemsForValidation = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        categoryId: '', // will be fetched by backend
        subtotal: (BigInt(item.price) * BigInt(item.quantity)).toString()
    }));

    try {
        const res = await validateCoupon.mutateAsync({
            code: couponCode,
            cartItems: cartItemsForValidation as any
        });
        
        if (res.valid) {
            setAppliedCoupon(res);
            toast.success("Promo-kod qo'llandi");
        } else {
            setAppliedCoupon(null);
            const msg = res.error === 'MIN_AMOUNT' ? `Minimal buyurtma: ${Number(BigInt(res.amountNeeded || '0')) / 100} so'm` : 'Promo-kod noto\'g\'ri yoki muddati o\'tgan';
            toast.error(msg);
        }
    } catch (err) {
        toast.error("Xatolik yuz berdi");
    }
  };

  const onSubmit = (data: any) => {
    if (isEmpty) return;

    createOrder.mutate({
      ...data,
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      couponCode: appliedCoupon?.valid ? couponCode : undefined,
    }, {
      onSuccess: (order: StorefrontOrderResponse) => {
        toast.success("Buyurtma qabul qilindi!");
        navigate({ to: `/orders/${order.id}` as any });
      },
      onError: (err: any) => {
        toast.error(err.message || "Xatolik yuz berdi");
      }
    });
  };

  if (isCartLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (isEmpty) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
    <ShoppingBag className="w-12 h-12 text-stone-200 mb-4" />
    <h2 className="text-xl font-light text-stone-600 mb-4">Savatchangiz bo'sh</h2>
    <Link to="/products" className="underline underline-offset-4 text-[#4A1525]">Xarid qilishda davom eting</Link>
  </div>;

  return (
    <div className="bg-[#f8f7f5] min-h-screen pb-24 pt-8">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-stone-200 text-stone-400 hover:text-[#4A1525] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-light text-[#4A1525]">Rasmiylashtirish</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[#4A1525]">
                    <User className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-medium text-[#4A1525]">Shaxsiy ma'lumotlar</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] text-stone-400 font-light ml-1">F.I.SH</label>
                    <input
                      {...form.register('fullName')}
                      placeholder="Ismingizni kiriting"
                      className="w-full h-12 px-4 rounded-2xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-colors"
                    />
                    {form.formState.errors.fullName && <p className="text-[11px] text-red-500 ml-1">{form.formState.errors.fullName.message as string}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] text-stone-400 font-light ml-1">Telefon raqam</label>
                    <input
                      {...form.register('phone')}
                      placeholder="+998 90 123 45 67"
                      className="w-full h-12 px-4 rounded-2xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-colors"
                    />
                    {form.formState.errors.phone && <p className="text-[11px] text-red-500 ml-1">{form.formState.errors.phone.message as string}</p>}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[#4A1525]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-medium text-[#4A1525]">Yetkazib berish manzili</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] text-stone-400 font-light ml-1">Shahar / Viloyat</label>
                      <input
                        {...form.register('city')}
                        placeholder="Masalan: Toshkent"
                        className="w-full h-12 px-4 rounded-2xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] text-stone-400 font-light ml-1">Tuman</label>
                      <input
                        {...form.register('district')}
                        placeholder="Masalan: Yunusobod"
                        className="w-full h-12 px-4 rounded-2xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] text-stone-400 font-light ml-1">To'liq manzil</label>
                    <textarea
                      {...form.register('address')}
                      placeholder="Ko'cha, uy, kvartira..."
                      className="w-full h-24 p-4 rounded-2xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              <button type="submit" className="hidden" id="submit-order" />
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
              <h2 className="text-lg font-medium text-[#4A1525] mb-6">Buyurtma tafsiloti</h2>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-stone-50 flex-shrink-0 overflow-hidden border border-stone-100 p-1">
                      <img src={item.imageUrls[0]} alt={item.productName} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#4A1525] truncate">{item.productName}</p>
                      <p className="text-[11px] text-stone-400 font-light">{item.quantity} ta × {regionCode === 'UZB' ? formatUzs(item.price) : formatKrw(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code input */}
              <div className="pt-4 border-t border-stone-50 mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input 
                            placeholder="Promo-kod..."
                            className="w-full h-10 pl-9 pr-4 rounded-xl bg-stone-50 border border-stone-100 text-[13px] outline-none focus:border-[#4A1525]"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={appliedCoupon?.valid}
                        />
                    </div>
                    {appliedCoupon?.valid ? (
                        <button 
                            onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    ) : (
                        <button 
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || validateCoupon.isPending}
                            className="px-4 h-10 bg-[#4A1525] text-white text-[12px] font-light rounded-xl hover:bg-[#6B2540] transition-colors disabled:opacity-50"
                        >
                            {validateCoupon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Qo\'llash'}
                        </button>
                    )}
                  </div>
                  {appliedCoupon?.valid && (
                      <p className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Promo-kod qo'llandi!
                      </p>
                  )}
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-50">
                <div className="flex justify-between text-[13px] font-light text-stone-500">
                  <span>Mahsulotlar</span>
                  <span>{regionCode === 'UZB' ? formatUzs(subtotal.toString()) : formatKrw(subtotal.toString())}</span>
                </div>
                <div className="flex justify-between text-[13px] font-light text-stone-500">
                  <span>Yetkazib berish</span>
                  {regionCode === 'UZB' ? (
                    <span className="text-emerald-600">BEPUL</span>
                  ) : (
                    <span>{korCargo === 0n ? 'BEPUL' : formatKrw(korCargo.toString())}</span>
                  )}
                </div>
                {appliedCoupon?.valid && (
                    <div className="flex justify-between text-[13px] font-medium text-emerald-600">
                        <span>Chegirma</span>
                        <span>-{regionCode === 'UZB' ? formatUzs(discountAmount.toString()) : formatKrw(discountAmount.toString())}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-medium text-[#4A1525] pt-2 border-t border-stone-50">
                  <span>Jami</span>
                  <span>{regionCode === 'UZB' ? formatUzs(finalTotal.toString()) : formatKrw(finalTotal.toString())}</span>
                </div>
              </div>

              <button
                onClick={() => document.getElementById('submit-order')?.click()}
                disabled={createOrder.isPending}
                className="w-full h-14 bg-[#4A1525] text-white font-light text-[15px] tracking-wide rounded-3xl mt-8 hover:bg-[#6B2540] transition-all duration-300 shadow-lg shadow-[#4A1525]/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createOrder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                Buyurtmani tasdiqlash
              </button>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[11px] text-stone-400 font-light">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>To'lov turini buyurtmadan so'ng tanlaysiz</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
