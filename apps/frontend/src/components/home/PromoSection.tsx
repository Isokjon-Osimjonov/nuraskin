import { formatDate } from '@nuraskin/shared-utils';
import * as React from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { cn } from '@/lib/utils';

export function PromoSection() {
  const { promotions } = usePromotions();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      // Ignore
    }
  };

  if (!promotions || promotions.length === 0) return null;

  return (
    <section className="px-4 md:px-6 py-16 sm:py-24">
      <div className="max-w-[1280px] mx-auto bg-[#3A0311] rounded-[32px] p-8 md:p-16 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Column */}
          <div className="text-center lg:text-left space-y-6">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-white/50 font-normal mb-3 uppercase">
                Maxsus takliflar
              </p>
              <h2 className="text-3xl md:text-4xl font-normal text-white leading-tight">
                Bugun tejang
              </h2>
            </div>

            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-[480px] mx-auto lg:mx-0">
              Birinchi buyurtmangizda chegirmalardan foydalaning. Kupon kodini nusxalab checkout
              sahifasida kiriting.
            </p>
          </div>

          {/* Right Column - Cards Grid */}
          <div
            className={cn(
              'grid gap-3 md:gap-4',
              promotions.length === 1 ? 'flex justify-center' : 'grid-cols-1 sm:grid-cols-2'
            )}
          >
            {promotions.map(promo => (
              <div
                key={promo.code || promo.displayText}
                className={cn(
                  'bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/10 flex flex-col items-center justify-center',
                  promotions.length === 1 && 'max-w-sm w-full'
                )}
              >
                <div className="text-white/90 font-normal text-sm leading-relaxed mb-2 text-center">
                  {promo.displayText}
                </div>

                {promo.firstOrderOnly && (
                  <p className="text-white/40 text-xs mt-2 text-center">
                    Faqat birinchi buyurtma uchun
                  </p>
                )}

                {promo.code && (
                  <div className="mt-4 w-full">
                    <code
                      onClick={() => handleCopy(promo.code!)}
                      className="block w-full text-center font-mono text-sm tracking-widest bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white cursor-pointer hover:bg-white/20 transition-colors select-none"
                    >
                      {copiedCode === promo.code ? '✓ Nusxalandi' : promo.code}
                    </code>
                  </div>
                )}

                {promo.expiresAt && (
                  <p className="text-white/40 text-[10px] md:text-xs mt-3 text-center uppercase tracking-wider">
                    Muddati: {formatDate(promo.expiresAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
