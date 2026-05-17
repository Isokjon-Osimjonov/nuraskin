import { ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function HeroLeftCol() {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left p-4 md:p-8 lg:p-12">
      <p className="text-white text-xs md:text-sm lg:text-base max-w-[200px] md:max-w-sm leading-relaxed">
        Zamonaviy formulalar bilan mukammallashtirilgan kundalik ishonch uchun
        yuqori darajali parvarishlash.
      </p>

      {/* NORD-style: pill label + separate round arrow button */}
      <div className="mt-5 flex items-center gap-3 self-center md:self-start">
        <Link
          to="/products"
          className="rounded-full px-4 py-2.5 md:px-8 md:py-3 text-sm font-light tracking-wide bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
        >
          Mahsulotlarni ko&apos;rish
        </Link>

        <Link
          to="/products"
          aria-label="Mahsulotlarga o'tish"
          className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-[#E30B5C] flex items-center justify-center shrink-0 hover:bg-[#6B2540] transition-colors shadow-lg"
        >
          <ArrowUpRight className="h-4 w-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
