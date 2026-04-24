import { createFileRoute } from '@tanstack/react-router';
import { HeroProduct } from '@/components/home/HeroProduct';
import { HeroLeftCol } from '@/components/home/HeroLeftCol';
import { HeroRightCol } from '@/components/home/HeroRightCol';
import { HeroFooter } from '@/components/home/HeroFooter';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { RecentProductsSection } from '@/components/home/RecentProductsSection';
import { AboutSummary } from '@/components/home/AboutSummary';

const HERO_BG_IMAGE = '/nsbg.png';
export const HERO_PRODUCT_IMAGE = '/nsb.png';

export const Route = createFileRoute('/')({
  component: HeroPage,
});

function HeroPage() {
  return (
    <>
      {/*
        margin-top: -64px  pulls the hero UP behind the 64px sticky navbar.
        height: 100vh      makes the image fill the full viewport (including the nav area).
        The transparent navbar now sits over the actual hero background image.
      */}
      <div
        className="relative"
        style={{
          height: '100vh',
          marginTop: '-64px',
          backgroundImage: `
            linear-gradient(180deg, rgba(20,5,12,0.35) 0%, rgba(40,8,22,0.25) 55%, rgba(15,3,8,0.55) 100%),
            url(${HERO_BG_IMAGE})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
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
          <span
            className="font-normal text-white select-none leading-none whitespace-nowrap opacity-90 md:opacity-100"
            style={{
              fontSize: 'clamp(2.5rem, 12vw, 14rem)',
              letterSpacing: '-0.02em',
            }}
          >
            SKIN ESSENCE
          </span>
        </div>

        {/* Product jar */}
        <HeroProduct productImage={HERO_PRODUCT_IMAGE} />

        {/* Left column */}
        <div className="absolute bottom-12 left-0 right-0 md:left-12 md:right-auto px-8 md:px-0 z-20 flex justify-center md:justify-start">
          <HeroLeftCol />
        </div>

        {/* Right column — desktop only */}
        <div className="hidden md:block absolute bottom-10 right-8 z-20">
          <HeroRightCol />
        </div>

        <HeroFooter />
      </div>

      <CategoriesSection />

      <RecentProductsSection />

      <AboutSummary />
    </>
  );
}
