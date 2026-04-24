import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] tracking-widest text-stone-400 font-light mb-4">
            Kompaniya haqida
          </p>
          <h1 className="text-3xl md:text-4xl font-normal text-[#4A1525] mb-6 leading-tight">
            Teringizni parvarishlanishi uchun ishonchli yondashuv.
          </h1>
        </div>

        {/* Hero Image */}
        <div className="aspect-[21/9] bg-stone-50 rounded-2xl overflow-hidden mb-14">
          <img
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1200"
            alt="Cherry Care brendi"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-normal text-[#4A1525] mb-4">Bizning hikoyamiz</h2>
              <p className="text-[14px] font-light text-stone-500 leading-relaxed mb-4">
                Cherry Care loyihasi O'zbekiston bozoriga jahon standartlariga javob beradigan, xavfsiz va samarali kosmetika mahsulotlarini yetkazish maqsadi bilan yaratildi. Biz go'zallik bu avvalo sog'lom teridan boshlanishiga qat'iy ishonamiz.
              </p>
              <p className="text-[14px] font-light text-stone-500 leading-relaxed">
                Ko'p insonlar o'z terisiga mos kelmaydigan vositalardan aziyat chekadi. Shuning uchun biz nafaqat mahsulot sotishni, balki mijozlarimizga to'g'ri maslahat berish va ularning terisiga mos mahsulotlarni aniqlashda ko'maklashishni o'z burchimiz deb bilamiz.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-[#f8f7f5] p-6 rounded-2xl">
                <h3 className="text-[15px] font-normal text-[#4A1525] mb-2">Sifat nazorati</h3>
                <p className="text-[13px] font-light text-stone-500 leading-relaxed">
                  Bizdagi barcha mahsulotlar qat'iy sifat nazoratidan o'tadi va faqat ishonchli manbalardan keltiriladi.
                </p>
              </div>
              <div className="bg-[#f8f7f5] p-6 rounded-2xl">
                <h3 className="text-[15px] font-normal text-[#4A1525] mb-2">Tabiiy tarkib</h3>
                <p className="text-[13px] font-light text-stone-500 leading-relaxed">
                  Biz zararli kimyoviy qo'shimchalardan holi, 100% tabiiy va organik ingredientlarga boy brendlarni tanlaymiz.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-12 text-center">
            <h2 className="text-2xl font-normal text-[#4A1525] mb-6">
              Go'zallik safaringizni biz bilan boshlang
            </h2>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-[#4A1525] text-white text-[13px] font-light tracking-wide px-7 py-3 rounded-full hover:bg-[#6B2540] transition-colors"
            >
              Katalogimizni ko'rish
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
