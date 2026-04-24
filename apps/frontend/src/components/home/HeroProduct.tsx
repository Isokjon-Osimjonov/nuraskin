interface HeroProductProps {
  productImage: string;
}

export function HeroProduct({ productImage }: HeroProductProps) {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] z-10 flex items-center justify-center">
      {/* Brand glow layer behind the jar */}
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(74,21,37,0.35) 0%, transparent 70%)',
          width: '140%',
          height: '140%',
          left: '-20%',
          top: '-20%',
        }}
      />

      <img
        src={productImage}
        alt="NuraSkin Face Cream jar"
        className="object-contain drop-shadow-2xl"
        style={{
          width: 'clamp(180px, 25vw, 460px)',
          filter: 'drop-shadow(0 30px 60px rgba(74,21,37,0.25))',
        }}
      />
    </div>
  );
}
