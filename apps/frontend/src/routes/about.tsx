import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldCheck, Package, Truck, Layers, Building2 } from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="bg-[#fff] min-h-screen py-10 px-4 md:px-6">
      <div className="max-w-[1280px] mx-auto space-y-4">
        <section className="bg-[#3A0311] rounded-3xl py-16 px-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] tracking-[0.2em] text-[#4A1525] font-normal mb-3 uppercase">
              Biz haqimizda
            </p>
            <h1 className="text-3xl md:text-5xl font-normal text-white mb-6 leading-tight max-w-[600px] mx-auto">
              Koreya go'zallik sirlarini to'g'ridan-to'g'ri sizga yetkazamiz
            </h1>
            <p className="text-[#c49aaa] text-sm md:text-base max-w-[480px] mx-auto leading-relaxed">
              Seoul markazidan Toshkentgacha — original mahsulotlar, adolatli
              narxlar, ishonchli xizmat.
            </p>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4A1525]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A1525]/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </section>

        {/* SECTION 2 — Who we are */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            className="about-store-image bg-[#f5e6ea] rounded-3xl h-64 md:h-full flex flex-col items-center justify-center text-[#4A1525]/40 about-image-placeholder"
            data-placeholder="true"
          >
            <Building2 size={48} strokeWidth={1} />
            <span className="text-xs mt-2 font-normal tracking-wide">
              Seoul do'koni rasmi
            </span>
          </div>

          <div className="bg-white border border-[#f0d0d8] rounded-3xl p-8 md:p-10 flex flex-col justify-center">
            <p className="text-[11px] tracking-[0.15em] text-[#4A1525] font-normal mb-4 uppercase">
              Kimligimiz
            </p>
            <div className="space-y-4">
              <p className="text-[15px] text-[#3A0311] leading-relaxed">
                NuraSkin — Seulda joylashgan koreya kosmetika do'koni. Biz
                O'zbekiston va Koreyadagi mijozlarga K-Beauty brendlarining
                original mahsulotlarini bevosita yetkazib beramiz.
              </p>
              <p className="text-[15px] text-[#3A0311] leading-relaxed">
                Yakka xaridorlar uchun ham, ulgurji xaridorlar uchun ham qulay
                sharoitlar yaratganmiz.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3 — 4 pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: ShieldCheck,
              title: '100% original mahsulotlar',
              text: 'Barcha mahsulotlar rasmiy Koreya distributorlaridan. Har doim kafolat.',
            },
            {
              icon: Package,
              title: "To'g'ridan-to'g'ri Koreyadan",
              text: 'Vositachilarsiz — bevosita Seuldan. Bozordagi eng adolatli narxlar.',
            },
            {
              icon: Truck,
              title: 'Tez va xavfsiz yetkazib berish',
              text: "Koreya ichida tezkor. O'zbekistonga ishonchli kargo orqali.",
            },
            {
              icon: Layers,
              title: 'Ulgurji narxlar',
              text: "Ko'p miqdorda xarid qiluvchilar uchun maxsus narxlar va individual takliflar.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#f0d0d8] rounded-3xl p-6 flex flex-col items-start text-start"
            >
              <item.icon className="text-[#4A1525] mb-4" size={24} />
              <h3 className="font-normal text-[13px] md:text-sm text-[#3A0311] mb-2 leading-tight">
                {item.title}
              </h3>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* SECTION 4 — Why NuraSkin */}
        <div className="pt-8">
          <p className="text-[11px] tracking-[0.15em] text-[#4A1525] font-normal mb-6 uppercase">
            Nima uchun NuraSkin?
          </p>
          <div className="space-y-3">
            {[
              {
                number: '01',
                title: 'K-Beauty ekspertlari',
                text: "Biz faqat mahsulot sotmaymiz — eng samarali formulalari bo'lgan brendlarni tanlab taqdim etamiz. Round Lab, Cosrx, Anua, Biodance va boshqalar.",
              },
              {
                number: '02',
                title: 'Qurilgan ishonch',
                text: "Har bir buyurtma kuzatiladi, har bir savol javob oladi. Mijozlarimiz bizga qayta-qayta murojaat qiladi — bu bizning eng yaxshi ko'rsatkichimiz.",
              },
              {
                number: '03',
                title: 'Hammaga qulay',
                text: "Bir dona xarid qilayotgan mijoz ham, ulgurji partiya olyotgan tadbirkor ham bir xil e'tibor va sifatli xizmat oladi.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#f0d0d8] rounded-3xl p-5 md:p-6 flex gap-5 items-start"
              >
                <div className="w-10 h-10 bg-[#fbeaf0] rounded-full flex items-center justify-center text-[#4A1525] font-normal text-sm flex-shrink-0">
                  {item.number}
                </div>
                <div>
                  <h3 className="font-normal text-sm md:text-base text-[#3A0311] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-stone-500 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5 — CTA */}
        <section className="bg-[#3A0311] rounded-3xl p-10 md:p-14 text-center mt-8">
          <p className="text-[#c49aaa] text-sm mb-2">Savollaringiz bormi?</p>
          <h2 className="text-white text-xl md:text-2xl font-normal mb-8">
            Biz Telegram orqali doim aloqadamiz
          </h2>
          <a
            href="https://t.me/nuraskin_manager_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#4A1525] text-white px-8 py-4 rounded-2xl text-sm font-normal inline-flex items-center gap-3 hover:bg-[#ff1a75] transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#4A1525]/20"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            @nuraskin_manager_bot
          </a>
        </section>
      </div>
    </div>
  );
}
