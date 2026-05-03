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
  const { isAuthenticated, regionCode } = useAppStore();
  const navigate = useNavigate();
  const { data: coupons = [], isLoading } = useCoupons();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  
  const displayPrice = (val: string | number) =>
    formatPrice(val, regionCode as 'UZB' | 'KOR');
  
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kupon kodi nusxalandi!");
  };
  
  // Filter by region if coupon has regionCode
  const filteredCoupons = coupons.filter(c => 
    !c.regionCode || c.regionCode === regionCode
  );
  
  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-medium 
            text-[#4A1525]">
            Kuponlarim
          </h1>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin 
              text-[#4A1525]" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-2xl 
            p-12 text-center">
            <Ticket className="w-12 h-12 
              text-stone-300 mx-auto mb-4" />
            <p className="text-[14px] font-light 
              text-stone-500">
              Hozircha faol kuponlar yo'q
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map(coupon => (
              <div key={coupon.id}
                className="bg-[#f8f7f5] rounded-2xl 
                  p-6 border border-stone-100 
                  relative overflow-hidden">
                
                {/* Dashed left border accent */}
                <div className="absolute left-0 top-4 
                  bottom-4 w-1 bg-[#4A1525] 
                  rounded-r-full" />
                
                <div className="pl-4">
                  <div className="flex items-start 
                    justify-between">
                    <div>
                      <h3 className="text-[16px] 
                        font-medium text-stone-800">
                        {coupon.name}
                      </h3>
                      {coupon.description && (
                        <p className="text-[12px] 
                          text-stone-500 mt-1">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[20px] 
                        font-bold text-[#4A1525]">
                        {coupon.type === 'PERCENTAGE'
                          ? `${coupon.value}%`
                          : displayPrice(coupon.value)
                        }
                      </span>
                      <p className="text-[11px] 
                        text-stone-400">
                        chegirma
                      </p>
                    </div>
                  </div>
                  
                  {/* Conditions */}
                  <div className="flex flex-wrap 
                    gap-2 mt-3">
                    {coupon.minOrderAmount && 
                      Number(coupon.minOrderAmount) > 0 && (
                      <span className="text-[11px] 
                        bg-white px-2.5 py-1 
                        rounded-full text-stone-500 
                        border border-stone-100">
                        Min: {displayPrice(
                          coupon.minOrderAmount
                        )}
                      </span>
                    )}
                    {coupon.expiresAt && (
                      <span className="text-[11px] 
                        bg-white px-2.5 py-1 
                        rounded-full text-stone-500 
                        border border-stone-100">
                        {new Date(coupon.expiresAt)
                          .toLocaleDateString('uz-UZ')} gacha
                      </span>
                    )}
                    {coupon.maxRedemptions && (
                      <span className="text-[11px] 
                        bg-white px-2.5 py-1 
                        rounded-full text-stone-500 
                        border border-stone-100">
                        {coupon.maxRedemptions - 
                          coupon.usageCount} ta qoldi
                      </span>
                    )}
                  </div>
                  
                  {/* Code + Copy */}
                  <div className="flex items-center 
                    gap-3 mt-4 pt-4 
                    border-t border-dashed 
                    border-stone-200">
                    <code className="text-[14px] 
                      font-mono font-bold 
                      text-[#4A1525] bg-white 
                      px-4 py-2 rounded-lg 
                      border border-stone-100 
                      tracking-wider">
                      {coupon.code}
                    </code>
                    <button
                      onClick={() => copyCode(
                        coupon.code
                      )}
                      className="text-[12px] 
                        text-[#4A1525] 
                        hover:underline 
                        font-medium">
                      Nusxalash
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}