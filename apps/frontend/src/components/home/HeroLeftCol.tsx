import { ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function HeroLeftCol() {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm md:max-w-md">
      <p className="text-white text-xs md:text-sm lg:text-base leading-relaxed">
        Zamonaviy formulalar bilan mukammallashtirilgan kundalik ishonch uchun yuqori darajali
        parvarishlash.
      </p>

      {/* Combined button with pill label and arrow inside */}
      <div className="mt-5 self-center md:self-start">
        <Link
          to="/products"
          className="group inline-flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5 md:pl-8 md:pr-2 md:py-2 text-sm md:text-base font-light tracking-wide bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <span className="py-0.5">Mahsulotlarni ko&apos;rish</span>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#4A1525] flex items-center justify-center shrink-0 group-hover:bg-[#6B2540] transition-colors shadow-inner">
            <ArrowUpRight className="h-4 w-4 md:h-4 md:w-4 text-white" />
          </div>
        </Link>
      </div>
    </div>
  );
}
