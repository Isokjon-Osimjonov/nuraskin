import { ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function HeroLeftCol() {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left">
      <p className="text-white text-base max-w-xs leading-relaxed">
        Zamonaviy formulalar bilan mukammallashtirilgan kundalik ishonch uchun
        yuqori darajali parvarishlash.
      </p>

      {/* NORD-style: pill label + separate round arrow button */}
      <div className="mt-5 flex items-center gap-3 self-center md:self-start">
        <Link
          to="/products"
          className="rounded-full px-8 py-3 text-sm font-light tracking-wide bg-white text-zinc-900 hover:bg-zinc-100 transition-colors shadow-lg"
        >
          Mahsulotlarni ko&apos;rish
        </Link>

        <Link
          to="/products"
          aria-label="Mahsulotlarga o'tish"
          className="w-11 h-11 rounded-full bg-[#
          ] flex items-center justify-center shrink-0 hover:bg-[#6B2540] transition-colors shadow-lg"
        >
          <ArrowUpRight className="h-4 w-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
