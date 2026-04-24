import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';

export const AboutSummary = () => {
  return (
    <section className="bg-[#f8f7f5] py-16 min-h-[70vh] flex flex-col justify-center">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* Image */}
          <div className="w-full md:w-1/2 aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
            <img
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=800"
              alt="Cherry Care — biz haqimizda"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2 space-y-5">
            <p className="text-[11px] tracking-widest uppercase text-stone-400 font-light">
              NuraSkin haqida
            </p>
            <h2 className="text-[26px] md:text-[32px] font-light text-[#4A1525] leading-snug">
              Premium Koreya kosmetikasi — teringiz uchun tanlangan.
            </h2>
            <p className="text-[14px] font-light text-stone-500 leading-relaxed">
              Biz eng sifatli Koreya va xalqaro teri parvarish formulalarini sinchkovlik bilan tanlaymiz — dermatolog tomonidan sinovdan o'tgan, yuqori samarali mahsulotlar, chinakam ko'rinadigan natijalar beradi.
            </p>
            <p className="text-[14px] font-light text-stone-500 leading-relaxed">
              Maqsadimiz oddiy: hamma uchun sog'lom, porlagan teri. Kollektsiyamizdagi har bir mahsulot ehtiyotkorlik va maqsad bilan tanlangan.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 group"
            >
              <span className="text-[13px] font-light text-[#4A1525] tracking-wide border-b border-[#4A1525]/30 group-hover:border-[#4A1525] transition-colors pb-0.5">
                Batafsil o'qish
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#4A1525] opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};
