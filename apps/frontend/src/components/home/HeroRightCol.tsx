import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useProducts } from '@/hooks/useProducts';
import { useAppStore } from '@/stores/app.store';

export function HeroRightCol() {
  const [index, setIndex] = useState(0);
  const { regionCode } = useAppStore();
  const navigate = useNavigate();
  const { data: productsData, isLoading } = useProducts({ limit: 5 });

  const heroProducts = productsData?.data ?? [];
  const total = heroProducts.length;

  const handlePrev = () => setIndex(i => (i - 1 + total) % total);
  const handleNext = () => setIndex(i => (i + 1) % total);

  if (isLoading) {
    return (
      <div className="hidden sm:flex flex-col items-end w-full sm:w-auto">
        <div className="bg-white rounded-2xl shadow-md p-4 w-[280px] sm:w-[300px] flex items-center gap-4 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-stone-100 rounded w-3/4" />
            <div className="h-4 bg-stone-100 rounded w-1/2" />
            <div className="h-3 bg-stone-100 rounded w-1/3 mt-3" />
          </div>
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-100" />
        </div>
      </div>
    );
  }

  if (total === 0) return null;

  const currentProduct = heroProducts[index];

  return (
    <div className="hidden sm:flex flex-col items-center justify-center sm:items-end sm:justify-end w-full sm:w-auto">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md p-4 w-[280px] sm:w-[300px] flex items-center gap-4 transition-all mx-auto sm:mx-0">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <p className="text-stone-900 font-normal text-sm sm:text-base leading-snug line-clamp-3 mb-3">
            {currentProduct?.name}
          </p>
          <button
            onClick={() =>
              navigate({ to: `/products/${currentProduct?.slug ?? currentProduct?.id}` })
            }
            className="text-xs sm:text-sm text-[#4A1525] underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            Mahsulotni kashf qilish
          </button>
        </div>

        {/* Right: image */}
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-50">
          {currentProduct?.imageUrls?.[0] ? (
            <img
              src={currentProduct.imageUrls[0]}
              alt={currentProduct.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center">
              <span className="text-2xl">🧴</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {total > 1 && (
        <div className="flex items-center justify-end gap-3 mt-3 w-full">
          {/* Prev — outline circle */}
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-full border border-stone-300 bg-white flex items-center justify-center text-stone-600 hover:border-stone-400 transition-colors shadow-sm"
          >
            ‹
          </button>

          {/* Counter */}
          <span className="text-stone-400 text-sm font-mono min-w-[40px] text-center">
            {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>

          {/* Next — filled dark circle */}
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-[#3A0311] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
