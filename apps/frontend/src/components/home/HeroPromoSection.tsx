import * as React from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { cn } from '@/lib/utils';

export function HeroPromoSection() {
  const { promotions } = usePromotions();
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback(code);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      // Ignore copy error
    }
  };

  if (promotions.length === 0) return null;

  // Show max 3
  const items = promotions.slice(0, 3);

  return (
    <div className="flex flex-wrap justify-center gap-3 px-4 pb-12 pt-2 z-20 relative">
      {items.map((promo) => (
        <div
          key={promo.code || promo.displayText}
          onClick={() => promo.code && handleCopy(promo.code)}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/15 transition-colors max-w-xs w-full sm:w-auto"
        >
          <div className="text-xl">
            {promo.type === 'FREE_SHIPPING' ? '🚚 ' : '🎁 '}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-white text-xs font-light! leading-tight line-clamp-1">
              {promo.displayText}
            </p>
            {promo.code && (
              <p className="text-white/60 text-[10px] font-mono mt-0.5 uppercase tracking-wider">
                {copyFeedback === promo.code ? 'Nusxalandi! ✓' : promo.code}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
