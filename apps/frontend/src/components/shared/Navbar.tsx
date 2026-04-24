import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingBag, Menu, User } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';

export interface NavbarProps {
  variant?: 'dark' | 'light';
}

const leftLinks = [
  { label: 'Bosh sahifa', to: '/' },
  { label: 'Mahsulotlar', to: '/products' },
  { label: 'Biz haqimizda', to: '/about' },
];
const rightLinks = [{ label: 'Aloqa', to: '/contact' }];

export function Navbar({ variant = 'light' }: NavbarProps) {
  const { cart } = useAppStore();
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [anyScroll, setAnyScroll] = useState(false);   // first pixel of scroll
  const [pastHero, setPastHero] = useState(false);     // scrolled past hero section

  useEffect(() => {
    const heroThreshold = () => window.innerHeight - 64;
    const check = () => {
      const y = window.scrollY;
      setAnyScroll(y > 0);
      setPastHero(y > heroThreshold());
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [variant]);

  // ① At rest on hero      → fully transparent
  // ② Scrolling in hero    → glass
  // ③ Past hero / light    → solid white
  // ④ Menu open            → force solid white
  const bg = menuOpen
    ? 'bg-white'
    : (variant === 'dark' && !pastHero
      ? anyScroll
        ? 'bg-black/20 backdrop-blur-md'
        : 'bg-transparent'
      : 'bg-white');

  // When menu is open, we force light-mode colors for visibility on white bg
  const isDarkMode = variant === 'dark' && !pastHero && !menuOpen;

  const linkBase = isDarkMode
    ? 'text-[13px] font-light tracking-wide text-white/75 hover:text-white transition-colors duration-200'
    : 'text-[13px] font-light tracking-wide text-stone-500 hover:text-stone-900 transition-colors duration-200';

  const linkActive = isDarkMode
    ? 'text-[13px] font-medium tracking-wide text-white'
    : 'text-[13px] font-medium tracking-wide text-zinc-900';

  const logoColor = isDarkMode ? 'text-white' : 'text-[#4A1525]';

  const cartStyle = isDarkMode
    ? 'border border-white/30 text-white/90 hover:bg-white/10'
    : 'border border-zinc-200 text-stone-700 hover:bg-zinc-50';

  const hamburgerColor = isDarkMode
    ? 'text-white/80 hover:text-white'
    : 'text-[#4A1525] hover:text-stone-900';

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${bg}`}>
        <nav className="relative max-w-[1280px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">

          {/* Left — Mobile: Hamburger | Desktop: Links */}
          <div className="flex flex-1 items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menyu"
              className={`md:hidden transition-colors ${hamburgerColor}`}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden md:flex items-center gap-8">
              {leftLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={linkBase}
                  activeProps={{ className: linkActive }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Center — logo */}
          <Link
            to="/"
            className={`absolute left-1/2 -translate-x-1/2 text-[15px] md:text-[17px] font-normal tracking-[0.2em] uppercase whitespace-nowrap transition-colors duration-300 ${logoColor}`}
          >
            NURASKIN
          </Link>

          {/* Right — contact + cart */}
          <div className="flex items-center justify-end gap-3 md:gap-6 flex-1">
            {rightLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`hidden md:block ${linkBase}`}
                activeProps={{ className: `hidden md:block ${linkActive}` }}
              >
                {link.label}
              </Link>
            ))}
            
            <Link
              to="/cart"
              aria-label="Savat"
              className={`flex items-center gap-2 rounded-full h-8 md:h-auto px-2 md:px-4 py-1.5 text-[13px] tracking-wide transition-all duration-200 relative ${cartStyle}`}
            >
              <span className="hidden md:inline">Savat</span>
              <ShoppingBag className="h-4 w-4 md:h-3.5 md:w-3.5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 bg-[#4A1525] text-white text-[9px] md:text-[10px] font-normal size-4 rounded-full flex items-center justify-center border border-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              aria-label="Profil"
              className={`flex items-center justify-center rounded-full size-8 transition-all duration-200 ${cartStyle}`}
            >
              <User className="size-4 md:size-4" />
            </Link>
          </div>
        </nav>

        {/* Mobile slide-down menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } ${!isDarkMode && menuOpen ? 'border-b border-stone-100' : ''}`}
        >
          <div className="px-6 py-6 flex flex-col gap-1">
            {[...leftLinks, ...rightLinks].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-4 rounded-xl text-[16px] font-light tracking-wide transition-all duration-200 ${
                  isDarkMode
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-[#4A1525]/80 hover:text-[#4A1525] hover:bg-[#4A1525]/5'
                }`}
                activeProps={{
                  className: `py-3 px-4 rounded-xl text-[16px] font-normal tracking-wide ${
                    isDarkMode ? 'text-white bg-white/10' : 'text-[#4A1525] bg-[#4A1525]/5'
                  }`,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
