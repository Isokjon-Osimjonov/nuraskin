import { ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useCategories } from '@/hooks/useCategories';

export function CategoriesSection() {
  const { data: categoriesData, isLoading } = useCategories();
  const categories = categoriesData?.data ?? [];

  return (
    <section className="py-28 px-8 md:px-16 max-w-[1280px] mx-auto min-h-[70vh] flex flex-col justify-center w-full">
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-14">
        <h2 className="text-[#4A1525] text-3xl font-light tracking-tight">
          Kategoriyalar
        </h2>
        <Link
          to="/products"
          className="text-sm font-light text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Barchasini ko&apos;rish
        </Link>
      </div>

      {/* Cards grid — horizontal scroll on mobile, 6-col on desktop */}
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="shrink-0 w-64 h-72 rounded-2xl bg-zinc-50 animate-pulse border border-zinc-100" />
        ))}
        
        {!isLoading && ((categories as any)?.data || categories || []).filter((c: any) => c.isActive).map((cat: any) => (
          <Link
            key={cat.id}
            to="/products"
            search={{ category: cat.slug }}
            className="group shrink-0 w-64 flex flex-col rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {/* Image area — white background, generous padding */}
            <div className="bg-white flex items-center justify-center h-52 p-8">
              <img
                src={cat.imageUrl || '/nsb.png'}
                alt={cat.name}
                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Label bar */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
              <span className="text-[#4A1525] text-sm font-light">
                {cat.name}
              </span>
              <span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-[#4A1525] group-hover:text-white transition-colors duration-200 shrink-0">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
