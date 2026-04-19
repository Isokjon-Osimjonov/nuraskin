import { ArrowUpRight } from 'lucide-react';

export function HeroLeftCol() {
  return (
    <div className="flex flex-col">
      <p className="text-white/60 text-sm max-w-[200px] md:max-w-[220px] leading-relaxed">
        Tabiat ilhomidan yaratilgan va zamonaviy formulalar bilan mukammallashtirilgan kundalik
        ishonch uchun yuqori darajali parvarishlash.
      </p>

      <button
        className="mt-4 flex items-center gap-3 self-start rounded-full px-5 py-2.5 border border-white/15 text-white text-sm hover:bg-white/10 transition-colors"
        style={{ backgroundColor: 'rgba(20,5,12,0.55)' }}
      >
        <span>Kashf eting</span>
        <span
          className="flex items-center justify-center rounded-full p-1.5 bg-[#E30B5C] shrink-0"
          style={{ boxShadow: '0 0 20px rgba(227,11,92,0.6)' }}
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-white" />
        </span>
      </button>

      <p className="mt-6 text-white/40 text-xs">Pastga aylantiring ↓</p>
    </div>
  );
}
