import * as React from 'react';
import { usePromotions } from '@/hooks/usePromotions';
import { cn } from '@/lib/utils';

export function AnnouncementBar() {
  const { promotions } = usePromotions();
  const [currentIndex, setCurrentTime] = React.useState(0);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      // Only rotate on sm+ screen sizes
      if (window.innerWidth >= 640) {
        setCurrentTime((prev) => (prev + 1) % promotions.length);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [promotions.length]);

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

  const current = promotions[currentIndex];

  return (
    <div className="relative bg-[#E30B5C] text-white flex items-center justify-center px-4 py-1 transition-all duration-500 overflow-hidden">
      <div className="w-full overflow-hidden">
        <div className="animate-marquee sm:animate-none inline-flex items-center gap-3 sm:flex sm:justify-center sm:w-full">
          <span className="text-xs sm:text-sm font-light text-white whitespace-nowrap">
            {current.displayText}
          </span>

          {current.code && (
            <span
              onClick={() => handleCopy(current.code!)}
              className="bg-white/20 rounded px-2 py-0.5 text-xs font-light font-mono cursor-pointer hover:bg-white/30 transition-colors text-white whitespace-nowrap shrink-0"
            >
              {copyFeedback ? '✓' : current.code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
