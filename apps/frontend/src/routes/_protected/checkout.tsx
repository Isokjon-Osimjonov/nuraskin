import { useState, useMemo, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronRight, ShoppingBag, MapPin, Phone, User, CreditCard, ArrowLeft, Loader2, Ticket, XCircle, CheckCircle2, Star, Plus, Search } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { useAddresses, useCreateAddress } from '@/hooks/useAddresses';
import { createStorefrontOrderSchema, StorefrontOrderResponse } from '@nuraskin/shared-types';
import { formatUzs, formatKrw } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { JusoSearchModal } from '@/components/addresses/JusoSearchModal';

export const Route = createFileRoute('/_protected/checkout')({
  component: CheckoutPage,
});

const UZB_REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati',
  'Samarqand', 'Buxoro', 'Namangan', 'Andijon',
  'Farg\'ona', 'Qashqadaryo', 'Surxondaryo',
  'Xorazm', 'Sirdaryo', 'Jizzax', 'Navoiy',
  'Qoraqalpog\'iston Respublikasi'
];

function CheckoutPage() {
  const { regionCode } = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cartData, isLoading: isCartLoading } = useCart();
  const { data: savedAddresses = [], isLoading: isAddressesLoading } = useAddresses();
  const createOrder = useCreateOrder();
  const validateCoupon = useValidateCoupon();
  const createAddressMutation = useCreateAddress();

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [jusoModalOpen, setJusoModalOpen] = useState(false);

  const cart = cartData?.items ?? [];
  const cartRegion = (cartData?.regionCode || regionCode) as 'UZB' | 'KOR';
  const isEmpty = cart.length === 0;

  const regionalAddresses = useMemo(() => 
    savedAddresses.filter(a => a.regionCode === cartRegion),
    [savedAddresses, cartRegion]
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + BigInt(item.price) * BigInt(item.quantity), 0n);
  }, [cart]);

  const formatPrice = (val: number | string | bigint) => {
    const amount = val.toString();
    return cartRegion === 'KOR' ? formatKrw(amount) : formatUzs(amount);
  };

  // Handle tiered Korea cargo
  const korCargo = useMemo(() => {
    if (cartRegion !== 'KOR') return 0n;
    if (subtotal >= 100000n) return 0n; // Dummy tier
    return 4000n;
  }, [subtotal, cartRegion]);

  const totalBeforeDiscount = subtotal + korCargo;
  const discountAmount = appliedCoupon?.valid ? BigInt(appliedCoupon.discountAmount) : 0n;
  const finalTotal = totalBeforeDiscount - discountAmount;

  const form = useForm<any>({
    resolver: zodResolver(createStorefrontOrderSchema as any),
    defaultValues: {
      items: [],
      regionCode: cartRegion,
      fullName: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      couponCode: '',
      addressId: undefined,
    },
  });

  const { register, setValue, watch, formState: { errors } } = form;

  // Sync selected address to form
  useEffect(() => {
    if (selectedAddressId === 'new') {
      form.setValue('addressId', undefined);
      form.reset({
        ...form.getValues(),
        fullName: '',
        phone: cartRegion === 'UZB' ? '+998' : '+82',
        city: '',
        district: cartRegion === 'UZB' ? UZB_REGIONS[0] : '',
        address: '',
      });
    } else {
      const addr = regionalAddresses.find(a => a.id === selectedAddressId);
      if (addr) {
        form.setValue('addressId', addr.id);
        form.setValue('fullName', addr.fullName);
        form.setValue('phone', addr.phone);
        
        if (addr.regionCode === 'UZB') {
            form.setValue('city', addr.uzbCity);
            form.setValue('district', addr.uzbRegion);
            form.setValue('address', addr.uzbStreet);
        } else {
            form.setValue('city', addr.korRoadAddress);
            form.setValue('district', addr.korPostalCode);
            form.setValue('address', `${addr.korBuilding ? addr.korBuilding + ', ' : ''}${addr.korDetail}`);
        }
      }
    }
  }, [selectedAddressId, regionalAddresses, form, cartRegion]);

  // Handle initial selection when addresses load
  useEffect(() => {
    if (regionalAddresses.length > 0 && selectedAddressId === 'new') {
        const def = regionalAddresses.find(a => a.isDefault);
        setSelectedAddressId(def ? def.id : regionalAddresses[0].id);
    }
  }, [regionalAddresses]);

  // Populate items from cart when cart loads
  useEffect(() => {
    if (cart.length) {
      form.setValue('items', cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })));
    }
  }, [cart, form]);

  // Set regionCode from cart
  useEffect(() => {
    if (cartData?.regionCode) {
      form.setValue('regionCode', cartData.regionCode);
    }
  }, [cartData?.regionCode, form]);

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

  const onSubmit = async (data: any) => {
    if (isEmpty) return;

    // Construct deliveryAddress if manually entered
    let deliveryAddress = undefined;
    if (selectedAddressId === 'new') {
        deliveryAddress = {
            fullName: data.fullName,
            phone: data.phone,
            line1: data.address,
            city: data.city,
            regionCode: cartRegion,
            postalCode: cartRegion === 'KOR' ? data.district : undefined,
        };
    }

    createOrder.mutate({
      ...data,
      deliveryAddress,
      couponCode: appliedCoupon?.valid ? couponCode : undefined,
    }, {
      onSuccess: async (order: StorefrontOrderResponse) => {
        toast.success("Buyurtma qabul qilindi!");
        
        // Save address if requested
        if (selectedAddressId === 'new' && saveNewAddress) {
            try {
                const addrData: any = {
                    label: 'Xarid manzili',
                    fullName: data.fullName,
                    phone: data.phone,
                    regionCode: cartRegion,
                    isDefault: regionalAddresses.length === 0,
                };
                if (cartRegion === 'UZB') {
                    addrData.uzbRegion = data.district;
                    addrData.uzbCity = data.city;
                    addrData.uzbStreet = data.address;
                } else {
                    addrData.korPostalCode = data.district;
                    addrData.korRoadAddress = data.city;
                    addrData.korDetail = data.address;
                }
                await createAddressMutation.mutateAsync(addrData);
            } catch (err) {
                console.error('Failed to save address:', err);
            }
        }

        queryClient.invalidateQueries({ queryKey: ['cart'] });
        navigate({ to: '/orders' });
      },
      onError: (err: any) => {
        toast.error(err.message || "Xatolik yuz berdi");
      }
    });
  };

  const handleJusoSelect = (result: any) => {
    setValue('city', result.road_address);
    setValue('district', result.postal_code);
    setValue('address', result.building_name || '');
    setJusoModalOpen(false);
  };

  if (isCartLoading || isAddressesLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (isEmpty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-16 h-16 text-stone-200 mb-4" />
        <h1 className="text-xl font-medium text-[#4A1525] mb-2">Savatchangiz bo'sh</h1>
        <p className="text-stone-400 text-sm mb-8">Buyurtma berish uchun mahsulot qo'shing</p>
        <Link to="/products" className="bg-[#4A1525] text-white px-8 py-3 rounded-full text-sm">
            Mahsulotlarni ko'rish
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFBFA] min-h-screen py-8 md:py-12">
      <div className="max-w-[1280px] mx-auto px-6">
        
        <div className="flex items-center gap-4 mb-8">
            <Link to="/cart" className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-stone-200 text-stone-400 hover:text-[#4A1525] transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-light text-[#4A1525]">Buyurtma berish</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
          
          <div className="space-y-6">
            {/* Address Selector */}
            {regionalAddresses.length > 0 && (
                <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
                    <h2 className="text-lg font-medium text-[#4A1525] mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Saqlangan manzillar
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {regionalAddresses.map((addr) => (
                            <button
                                key={addr.id}
                                type="button"
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`text-left p-4 rounded-2xl border-2 transition-all ${
                                    selectedAddressId === addr.id 
                                    ? 'border-[#4A1525] bg-[#4A1525]/5 shadow-sm' 
                                    : 'border-stone-100 bg-stone-50/50 hover:border-stone-200'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[13px] font-medium text-[#4A1525]">{addr.label}</span>
                                    {addr.isDefault && <Star className="w-3 h-3 text-[#4A1525] fill-current" />}
                                </div>
                                <p className="text-[12px] text-stone-600 font-normal line-clamp-1">{addr.fullName}</p>
                                <p className="text-[11px] text-stone-400 font-light truncate">
                                    {addr.regionCode === 'UZB' 
                                        ? `${addr.uzbStreet}, ${addr.uzbCity}` 
                                        : `${addr.korRoadAddress} ${addr.korDetail}`}
                                </p>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setSelectedAddressId('new')}
                            className={`text-left p-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
                                selectedAddressId === 'new' 
                                ? 'border-[#4A1525] bg-[#4A1525]/5 text-[#4A1525]' 
                                : 'border-stone-200 text-stone-400 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-[12px] font-medium">Yangi manzil</span>
                        </button>
                    </div>
                </section>
            )}

            <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Info */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#4A1525]/5 flex items-center justify-center text-[#4A1525]">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-medium text-[#4A1525]">
                            {selectedAddressId === 'new' ? 'Yangi manzil kiritish' : 'Manzil tafsilotlari'}
                        </h2>
                    </div>
                    {selectedAddressId !== 'new' && (
                        <button 
                            type="button"
                            onClick={() => setSelectedAddressId('new')}
                            className="text-[12px] text-[#4A1525] font-normal hover:underline"
                        >
                            Tahrirlash
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-stone-500 ml-1">F.I.SH</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input 
                            {...register('fullName')} 
                            readOnly={selectedAddressId !== 'new'}
                            placeholder="Ism va familiyangiz"
                            className={`w-full h-12 pl-11 pr-4 rounded-2xl border text-[14px] outline-none transition-all ${
                                selectedAddressId !== 'new' 
                                ? 'bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed' 
                                : 'bg-white border-stone-100 focus:border-[#4A1525]'
                            }`}
                        />
                    </div>
                    {errors.fullName && <p className="text-[11px] text-red-500 ml-1">{errors.fullName.message as string}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-stone-500 ml-1">Telefon raqam</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input 
                            {...register('phone')} 
                            readOnly={selectedAddressId !== 'new'}
                            placeholder={cartRegion === 'UZB' ? '+998 90 123 45 67' : '+82 10 1234 5678'}
                            className={`w-full h-12 pl-11 pr-4 rounded-2xl border text-[14px] outline-none transition-all ${
                                selectedAddressId !== 'new' 
                                ? 'bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed' 
                                : 'bg-white border-stone-100 focus:border-[#4A1525]'
                            }`}
                        />
                    </div>
                    {errors.phone && <p className="text-[11px] text-red-500 ml-1">{errors.phone.message as string}</p>}
                  </div>

                  {cartRegion === 'UZB' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-stone-500 ml-1">Viloyat</label>
                        <select
                          {...register('district')}
                          disabled={selectedAddressId !== 'new'}
                          className={`w-full h-12 px-4 rounded-2xl border text-[14px] outline-none transition-all appearance-none ${
                            selectedAddressId !== 'new' 
                            ? 'bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed' 
                            : 'bg-white border-stone-100 focus:border-[#4A1525]'
                          }`}
                        >
                          {UZB_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-stone-500 ml-1">Shahar / Tuman</label>
                        <input
                          {...register('city')}
                          readOnly={selectedAddressId !== 'new'}
                          placeholder="Masalan: Yunusobod tumani"
                          className={`w-full h-12 px-4 rounded-2xl border text-[14px] outline-none transition-all ${
                            selectedAddressId !== 'new' 
                            ? 'bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed' 
                            : 'bg-white border-stone-100 focus:border-[#4A1525]'
                          }`}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="flex items-end justify-between">
                            <label className="text-[12px] font-medium text-stone-500 ml-1">Pochta indeksi</label>
                            {selectedAddressId === 'new' && (
                                <button 
                                    type="button" 
                                    onClick={() => setJusoModalOpen(true)}
                                    className="text-[11px] text-[#4A1525] font-medium hover:underline mb-1"
                                >
                                    Qidirish
                                </button>
                            )}
                        </div>
                        <input
                          {...register('district')}
                          readOnly
                          placeholder="12345"
                          className="w-full h-12 px-4 rounded-2xl border bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed text-[14px] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-medium text-stone-500 ml-1">Asosiy manzil</label>
                        <input
                          {...register('city')}
                          readOnly
                          placeholder="서울특별시..."
                          className="w-full h-12 px-4 rounded-2xl border bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed text-[14px] outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[12px] font-medium text-stone-500 ml-1">
                        {cartRegion === 'UZB' ? 'To\'liq manzil (ko\'cha, uy, kvartira)' : 'Batafsil manzil'}
                    </label>
                    <textarea 
                        {...register('address')} 
                        readOnly={selectedAddressId !== 'new' && cartRegion === 'UZB'}
                        placeholder={cartRegion === 'UZB' 
                            ? "Yakkasaroy tumani, Shota Rustaveli ko'chasi, 12-uy, 45-xonadon" 
                            : "101-dong, 502-ho"}
                        rows={3}
                        className={`w-full p-4 rounded-2xl border text-[14px] outline-none transition-all resize-none ${
                            selectedAddressId !== 'new' && cartRegion === 'UZB'
                            ? 'bg-stone-50 border-stone-100 text-stone-500 cursor-not-allowed' 
                            : 'bg-white border-stone-100 focus:border-[#4A1525]'
                        }`}
                    />
                  </div>
                </div>

                {selectedAddressId === 'new' && (
                    <div className="flex items-center gap-3 mt-6 p-1">
                        <input
                            type="checkbox"
                            id="saveNewAddress"
                            checked={saveNewAddress}
                            onChange={(e) => setSaveNewAddress(e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-[#4A1525] focus:ring-[#4A1525]"
                        />
                        <label htmlFor="saveNewAddress" className="text-[13px] text-stone-600 cursor-pointer">
                            Ushbu manzilni keyingi xaridlar uchun saqlash (max 5 ta)
                        </label>
                    </div>
                )}
              </section>

              {/* Payment Method - Coming Soon */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100 opacity-60">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-medium text-stone-400">To'lov turi</h2>
                </div>
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[#4A1525] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4A1525]" />
                    </div>
                    <span className="text-[14px] font-medium text-stone-600">Buyurtmadan so'ng (Karta orqali / Naqd)</span>
                  </div>
                </div>
              </section>

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
                      <p className="text-[11px] text-stone-400 font-light">{item.quantity} ta × {formatPrice(item.price)}</p>
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
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] font-light text-stone-500">
                  <span>Yetkazib berish</span>
                  {cartRegion === 'UZB' ? (
                    <span className="text-emerald-600">BEPUL</span>
                  ) : (
                    <span>{korCargo === 0n ? 'BEPUL' : formatPrice(korCargo)}</span>
                  )}
                </div>
                {appliedCoupon?.valid && (
                    <div className="flex justify-between text-[13px] font-medium text-emerald-600">
                        <span>Chegirma</span>
                        <span>-{formatPrice(discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-medium text-[#4A1525] pt-2 border-t border-stone-50">
                  <span>Jami</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
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
      
      <JusoSearchModal
        open={jusoModalOpen}
        onOpenChange={setJusoModalOpen}
        onSelect={handleJusoSelect}
      />
    </div>
  );
}
