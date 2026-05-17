import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Ticket, Loader2 } from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { useAppStore } from '@/stores/app.store';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const Route = createFileRoute('/_protected/coupons')({
  component: CouponsPage,
});

function CouponsPage() {
  const { isAuthenticated, regionCode, selectedCouponCode, setSelectedCouponCode } = useAppStore();
  const navigate = useNavigate();
  const { data: coupons = [], isLoading } = useCoupons();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  // Auto-apply logic
  useEffect(() => {
    if (coupons.length > 0 && !selectedCouponCode) {
      const autoCoupon = coupons.find(c => c.autoApplied);
      if (autoCoupon) {
        setSelectedCouponCode(autoCoupon.code);
        toast.success(`🎉 ${autoCoupon.name} avtomatik qo'llanildi!`);
      }
    }
  }, [coupons, selectedCouponCode, setSelectedCouponCode]);

  if (!isAuthenticated) return null;
  
  const displayPrice = (val: string | number, rCode?: string | null) => {
    const region = rCode && rCode !== 'ALL' ? rCode : regionCode;
    return formatPrice(val, region as 'UZB' | 'KOR');
  };
  
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kupon kodi nusxalandi!");
  };

  const handleSelect = (coupon: any) => {
    if (selectedCouponCode === coupon.code) {
      setSelectedCouponCode(null);
    } else {
      setSelectedCouponCode(coupon.code);
      toast.success("Kupon tanlandi!");
    }
  };
  
  const filteredCoupons = coupons.filter(c => 
    !c.regionCode || c.regionCode === 'ALL' || c.regionCode === regionCode
  );

  const activeCoupon = coupons.find(c => c.code === selectedCouponCode);
  
  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-medium text-[#4A1525]">Kuponlarim</h1>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#4A1525]" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
            <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-[14px] font-light text-stone-500">Hozircha faol kuponlar yo'q</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map(coupon => {
              const isSelected = selectedCouponCode === coupon.code;
              const isOtherSelected = selectedCouponCode && selectedCouponCode !== coupon.code;
              // If another is selected, and this one is NOT stackable OR the other is NOT stackable, disable it
              const isDisabledSelection = isOtherSelected && (!coupon.isStackable || !activeCoupon?.isStackable);
              const isUsed = coupon.isUsed;

              return (
                <div key={coupon.id}
                  className={`bg-[#f8f7f5] rounded-2xl p-6 border border-stone-100 relative overflow-hidden transition-all ${isUsed ? 'opacity-50 grayscale' : ''} ${isSelected ? 'ring-2 ring-[#4A1525] ring-offset-2' : ''}`}
                >
                  {/* Dashed left border accent */}
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#4A1525] rounded-r-full" />
                  
                  <div className="pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isUsed && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-600 px-2 py-0.5 rounded">
                              Ishlatilgan
                            </span>
                          )}
                          {!isUsed && coupon.autoApplied && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                              ✓ Avtomatik qo'llanildi
                            </span>
                          )}
                          {!isUsed && coupon.isTargeted && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              👤 Maxsus taklif
                            </span>
                          )}
                        </div>
                        <h3 className="text-[16px] font-medium text-stone-800">{coupon.name}</h3>
                        {coupon.description && (
                          <p className="text-[12px] text-stone-500 mt-1">{coupon.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[20px] font-bold text-[#4A1525]">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : coupon.type === 'FREE_SHIPPING'
                            ? 'BEPUL'
                            : displayPrice(coupon.regionCode === 'ALL' ? (regionCode === 'UZB' ? (coupon as any).valueUzs : (coupon as any).valueKrw) : coupon.value, coupon.regionCode === 'ALL' ? regionCode : coupon.regionCode)
                          }
                        </span>
                        <p className="text-[11px] text-stone-400">
                          {coupon.type === 'FREE_SHIPPING' ? 'yetkazib berish' : 'chegirma'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Scope and Conditions */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {coupon.scope === 'PRODUCTS' && (
                        <span className="text-[11px] bg-[#4A1525]/5 px-2.5 py-1 rounded-full text-[#4A1525] font-medium">
                          📦 {coupon.applicableProductNames?.length === 1 ? coupon.applicableProductNames[0] : `${coupon.applicableProductNames?.length || 0} ta mahsulot`} uchun
                        </span>
                      )}
                      {coupon.scope === 'CATEGORIES' && (
                        <span className="text-[11px] bg-[#4A1525]/5 px-2.5 py-1 rounded-full text-[#4A1525] font-medium">
                          🏷 {coupon.applicableCategoryNames?.length === 1 ? coupon.applicableCategoryNames[0] : `${coupon.applicableCategoryNames?.length || 0} ta kategoriya`} uchun
                        </span>
                      )}
                      {coupon.scope === 'BRANDS' && (
                        <span className="text-[11px] bg-[#4A1525]/5 px-2.5 py-1 rounded-full text-[#4A1525] font-medium">
                          🏷 {coupon.applicableBrands?.length === 1 ? coupon.applicableBrands[0] : `${coupon.applicableBrands?.length || 0} ta brend`} uchun
                        </span>
                      )}

                      {((coupon.regionCode === 'ALL' ? (regionCode === 'UZB' ? (coupon as any).minOrderUzs : (coupon as any).minOrderKrw) : coupon.minOrderAmount)) && 
                        Number(coupon.regionCode === 'ALL' ? (regionCode === 'UZB' ? (coupon as any).minOrderUzs : (coupon as any).minOrderKrw) : coupon.minOrderAmount) > 0 && (
                        <span className="text-[11px] bg-white px-2.5 py-1 rounded-full text-stone-500 border border-stone-100">
                          Min: {displayPrice(
                            coupon.regionCode === 'ALL' ? (regionCode === 'UZB' ? (coupon as any).minOrderUzs : (coupon as any).minOrderKrw) : coupon.minOrderAmount || 0, coupon.regionCode === 'ALL' ? regionCode : coupon.regionCode
                          )}
                        </span>
                      )}
                      {coupon.expiresAt && (
                        <span className="text-[11px] bg-white px-2.5 py-1 rounded-full text-stone-500 border border-stone-100">
                          {new Date(coupon.expiresAt).toLocaleDateString('uz-UZ')} gacha
                        </span>
                      )}
                      {coupon.maxRedemptions && (
                        <span className="text-[11px] bg-white px-2.5 py-1 rounded-full text-stone-500 border border-stone-100">
                          {coupon.maxRedemptions - coupon.usageCount} ta qoldi
                        </span>
                      )}
                    </div>
                    
                    {/* Code + Copy / Select */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-stone-200">
                      <div className="flex items-center gap-3">
                        <code className="text-[14px] font-mono font-bold text-[#4A1525] bg-white px-4 py-2 rounded-lg border border-stone-100 tracking-wider">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-[12px] text-[#4A1525] hover:underline font-medium"
                        >
                          Nusxalash
                        </button>
                      </div>

                      {!isUsed && (
                        <div className="relative group">
                          <button
                            onClick={() => handleSelect(coupon)}
                            disabled={isDisabledSelection}
                            className={`px-6 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : isDisabledSelection
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                : 'bg-[#4A1525] text-white hover:bg-[#6B2540]'
                            }`}
                          >
                            {isSelected ? 'Bekor qilish' : 'Tanlash'}
                          </button>
                          {isDisabledSelection && (
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-max bg-stone-800 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-sm">
                              Faqat 1 ta kupon ishlatish mumkin
                            </div>
                          )}
                        </div>
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
  );
}