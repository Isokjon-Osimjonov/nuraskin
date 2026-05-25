import { Link } from '@tanstack/react-router';

export const AboutSummary = () => {
  return (
    <section className="px-4 md:px-6 py-12">
      <div className="max-w-[1280px] mx-auto bg-[#3A0311] rounded-[32px] p-8 md:p-16 relative overflow-hidden">
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-white/50 font-normal mb-3 uppercase">
                Biz haqimizda
              </p>
              <h2 className="text-2xl md:text-4xl font-normal text-white leading-tight">
                Koreya kosmetikasini <br /> bevosita Seuldan oling
              </h2>
            </div>
            
            <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-[480px]">
              NuraSkin orqali Round Lab, Cosrx, Anua va boshqa brendlarning original mahsulotlarini to'g'ridan-to'g'ri Koreya narxlarida xarid qiling. O'zbekistonga kargo, Koreya ichida tezkor yetkazib berish.
            </p>

            <Link
              to="/about"
              className="inline-block border border-white/40 text-white px-6 py-2.5 rounded-xl text-sm font-normal hover:bg-white/10 transition-all active:scale-95"
            >
              Biz haqimizda ko'proq
            </Link>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[
              { value: "100%", label: "Original mahsulotlar" },
              { value: "2 ta", label: "Mintaqa: KOR + UZB" },
              { value: "Ulgurji", label: "Maxsus narxlar" },
              { value: "Tezkor", label: "Yetkazib berish" }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="text-white font-normal text-xl md:text-2xl">
                  {stat.value}
                </div>
                <div className="text-white/50 text-[11px] md:text-xs mt-1 uppercase tracking-wider font-light">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
