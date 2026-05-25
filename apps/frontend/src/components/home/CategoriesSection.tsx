import { ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useCategories } from '@/hooks/useCategories';
import { typography } from '@/lib/typography';
import { EmptySection } from '@/components/shared/EmptySection';

export function CategoriesSection() {
  const { data: categoriesData, isLoading } = useCategories();
  const rawCategories = categoriesData?.data ?? [];
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const activeCategories = categories.filter((c: any) => c.isActive);

  return (
    <section className="px-4 md:px-6 py-12">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header row */}
        <div className="flex items-baseline justify-between mb-8">
          <div className="space-y-1">
            <p className={typography.sectionLabel}>Bo&apos;limlar</p>
            <h2 className={typography.sectionTitle}>
              Kategoriyalar
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-normal text-stone-400 hover:text-[#4A1525] transition-colors"
          >
            Barchasini ko&apos;rish
          </Link>
        </div>

        <div className="w-full mt-6">
          {isLoading ? (
            /* Loading state — skeletons */
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-64 h-72 rounded-2xl bg-stone-100 animate-pulse" />
              ))}
            </div>
          ) : activeCategories.length === 0 ? (
            /* Empty state */
            <EmptySection
              title="Kategoriyalar hali mavjud emas"
              subtitle="Tez orada yangi kategoriyalar qo'shiladi"
            />
          ) : (
            /* Cards grid — horizontal scroll on mobile */
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
              {activeCategories.map((cat: any) => (
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
                  <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100">
                    <span className={typography.cardTitle}>
                      {cat.name}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-[#4A1525] group-hover:text-white transition-colors duration-200 shrink-0">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
