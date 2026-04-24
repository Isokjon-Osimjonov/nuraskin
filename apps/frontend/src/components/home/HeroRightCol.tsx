import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Product {
  name: string;
  image: string;
  slug: string;
}

// Placeholder products — will be swapped for real API data
const PRODUCTS: Product[] = [
  { name: 'Heartleaf 77\nClear Toner Pad', image: '/nsb.png', slug: 'heartleaf-77-clear-toner-pad' },
  { name: 'NuraSkin\nFace Cream',          image: '/nsb.png', slug: 'nuraskin-face-cream' },
  { name: 'Soothing\nBarrier Serum',       image: '/nsb.png', slug: 'soothing-barrier-serum' },
  { name: 'Ceramide\nMoisture Gel',        image: '/nsb.png', slug: 'ceramide-moisture-gel' },
  { name: 'Niacinamide\nBright Essence',   image: '/nsb.png', slug: 'niacinamide-bright-essence' },
];

export function HeroRightCol() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + PRODUCTS.length) % PRODUCTS.length);
  const next = () => setIndex((i) => (i + 1) % PRODUCTS.length);

  const product = PRODUCTS[index];
  const total   = PRODUCTS.length;
  const progressPct = ((index + 1) / total) * 100;

  return (
    <div className="flex flex-col items-end gap-4">

      {/* Carousel nav — left btn | progress line | counter | right btn */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={prev}
          aria-label="Oldingi"
          className="w-9 h-9 rounded-full border border-white/40 text-white/80 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Animated progress line */}
        <div className="flex-1 h-px bg-white/20 relative">
          <div
            className="absolute left-0 top-0 h-full bg-white/70 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <span className="text-white/70 text-xs tabular-nums shrink-0">
          {String(index + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(total).padStart(2, '0')}
        </span>

        <button
          onClick={next}
          aria-label="Keyingi"
          className="w-9 h-9 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-white/90 transition-colors shadow-lg shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex w-64 h-36">

        {/* Left: product name + link */}
        <div className="flex flex-col justify-between p-4 flex-1">
          <p className="text-zinc-900 font-normal text-base leading-snug whitespace-pre-line">
            {product.name}
          </p>

          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="text-zinc-900 text-xs font-light underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
          >
            Mahsulotni ko&apos;rish
          </Link>
        </div>

        {/* Right: product image panel */}
        <div className="w-28 relative bg-zinc-50 shrink-0">
          <img
            src={product.image}
            alt={product.name.replace('\n', ' ')}
            className="absolute inset-0 w-full h-full object-contain p-2"
          />
        </div>
      </div>
    </div>
  );
}
