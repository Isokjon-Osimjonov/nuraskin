import { createFileRoute } from '@tanstack/react-router';
import { HeroProduct } from '@/components/home/HeroProduct';
import { HeroLeftCol } from '@/components/home/HeroLeftCol';
import { HeroRightCol } from '@/components/home/HeroRightCol';
import { HeroFooter } from '@/components/home/HeroFooter';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { RecentProductsSection } from '@/components/home/RecentProductsSection';
import { AboutSummary } from '@/components/home/AboutSummary';
import { PromoSection } from '@/components/home/PromoSection';

const HERO_BG_IMAGE = '/nsbg.png';
export const HERO_PRODUCT_IMAGE = '/nsb.png';

export const Route = createFileRoute('/')({
  component: HeroPage,
});

function HeroPage() {
  return (
    <>
      <div
        className="relative overflow-hidden bg-[60%_center] md:bg-center"
        style={{
          minHeight: '100svh',
          marginTop: '-64px',
          backgroundImage: `
            linear-gradient(180deg, rgba(20,5,12,0.35) 0%, rgba(40,8,22,0.25) 55%, rgba(15,3,8,0.55) 100%),
            url(${HERO_BG_IMAGE})
          `,
          backgroundSize: 'cover',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 60% 50% at 50% 48%, rgba(74,21,37,0.22) 0%, transparent 70%),
              radial-gradient(ellipse at 70% 30%, rgba(74,21,37,0.18) 0%, transparent 50%)
            `,
          }}
        />

        {/* SKIN ESSENCE — large editorial text behind jar */}
        <div
          className="absolute inset-x-0 flex justify-center pointer-events-none z-0 px-4"
          style={{ top: 'clamp(15%, 25%, 35%)' }}
        >
          <span className="font-normal text-white select-none leading-none whitespace-nowrap opacity-90 md:opacity-100 text-[clamp(40px,12vw,180px)] tracking-tight">
            SKIN ESSENCE
          </span>
        </div>

        {/* Product jar */}
        <HeroProduct productImage={HERO_PRODUCT_IMAGE} />

        {/* Hero content wrapper — sitting ~30% up */}
        <div className="absolute bottom-24 sm:bottom-28 lg:bottom-32 left-0 right-0 px-6 sm:px-12 lg:px-16 z-20 flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <HeroLeftCol />
          <HeroRightCol />
        </div>

        <HeroFooter />
      </div>

      <CategoriesSection />

      <RecentProductsSection />

      <AboutSummary />

      <PromoSection />
    </>
  );
}
