import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';

interface HeroRightColProps {
  thumbImage: string;
}

export function HeroRightCol({ thumbImage }: HeroRightColProps) {
  return (
    <div className="flex flex-col items-end">
      {/* Carousel controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Oldingi"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-white/60 text-xs mx-2 tabular-nums">02 / 05</span>

        <button
          className="w-8 h-8 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-white/90 transition-colors shadow-md"
          aria-label="Keyingi"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Product thumbnail card */}
      <div className="bg-white rounded-2xl p-4 w-56 shadow-2xl flex justify-between items-start gap-3">
        {/* Left: text info */}
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-zinc-900 font-medium text-sm leading-tight">
            Heartleaf 77 Clear Toner Pad
          </p>
          <span className="mt-2 inline-flex items-center justify-center rounded-full p-1.5 bg-[#E30B5C]/10 self-start">
            <Leaf className="h-3.5 w-3.5 text-[#E30B5C]" />
          </span>
          <p className="mt-2 text-[#E30B5C] text-xs font-medium">
            Mahsulotni ko&apos;rish →
          </p>
        </div>

        {/* Right: thumbnail with "77%" overlay */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <img
            src={thumbImage}
            alt="Heartleaf 77 Clear Toner Pad"
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center font-black text-white text-lg leading-none"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            77%
          </span>
        </div>
      </div>
    </div>
  );
}
