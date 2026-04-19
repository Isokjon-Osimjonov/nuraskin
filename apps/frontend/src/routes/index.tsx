import { createFileRoute } from '@tanstack/react-router';
import { HeroNav } from '@/components/home/HeroNav';
import { HeroProduct } from '@/components/home/HeroProduct';
import { HeroLeftCol } from '@/components/home/HeroLeftCol';
import { HeroRightCol } from '@/components/home/HeroRightCol';
import { HeroFooter } from '@/components/home/HeroFooter';

const HERO_BG_IMAGE = '/nsbg.png';
export const HERO_PRODUCT_IMAGE = '/nsb.png';
export const HERO_THUMB_IMAGE = '/nsb.png';

export const Route = createFileRoute('/')({
  component: HeroPage,
});

function HeroPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(20,5,12,0.35) 0%, rgba(40,8,22,0.25) 55%, rgba(15,3,8,0.55) 100%),
          url(${HERO_BG_IMAGE})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >

      {/* Soft pink radial glow behind product */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 50% 48%, rgba(227,11,92,0.22) 0%, transparent 70%),
            radial-gradient(ellipse at 70% 30%, rgba(139,45,20,0.18) 0%, transparent 50%)
          `,
        }}
      />

      <HeroNav />

      <div className="relative min-h-screen">
        {/* SKIN ESSENCE — behind the jar, lifted toward the top */}
        <div className="absolute inset-x-0 top-[22vh] flex justify-center pointer-events-none z-0">
          <span
            className="font-bold text-white select-none leading-none whitespace-nowrap"
            style={{
              fontSize: 'clamp(2rem, 9vw, 11rem)',
              letterSpacing: '-0.035em',
            }}
          >
            SKIN ESSENCE
          </span>
        </div>

        {/* Product jar — z-10, sits on top of the text */}
        <HeroProduct productImage={HERO_PRODUCT_IMAGE} />

        {/* Left column — bottom left */}
        <div className="absolute bottom-24 left-6 md:left-10 z-20">
          <HeroLeftCol />
        </div>

        {/* Right column — bottom right, desktop only */}
        <div className="hidden md:block absolute bottom-16 right-8 z-20">
          <HeroRightCol thumbImage={HERO_THUMB_IMAGE} />
        </div>
      </div>

      <HeroFooter />
    </div>
  );
}
