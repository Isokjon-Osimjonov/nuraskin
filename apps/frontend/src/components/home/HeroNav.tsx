import { useState } from 'react';
import { ShoppingBag, Menu, X } from 'lucide-react';

const leftLinks = [
  { label: 'Home', href: '#' },
  { label: 'Categories', href: '#' },
  { label: 'About Us', href: '#' },
];

const rightLinks = [{ label: 'Contact Us', href: '#' }];

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-8">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
        aria-label="Close menu"
      >
        <X className="h-6 w-6" />
      </button>
      {[...leftLinks, ...rightLinks].map((link) => (
        <a
          key={link.label}
          href={link.href}
          onClick={onClose}
          className="text-white text-2xl hover:text-white/70 transition-colors"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function HeroNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center px-6 md:px-10 py-5">
        {/* Left: nav links */}
        <div className="flex-1 hidden md:flex items-center gap-7">
          {leftLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white/80 text-sm tracking-wide hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile: hamburger on the left */}
        <div className="flex-1 md:hidden">
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Center: brand wordmark */}
        <div className="flex-1 flex justify-center">
          <span className="text-white font-semibold text-lg md:text-xl tracking-[0.25em]">
            NURASKIN
          </span>
        </div>

        {/* Right: contact + cart */}
        <div className="flex-1 flex items-center justify-end gap-5">
          {rightLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hidden md:block text-white/80 text-sm tracking-wide hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}

          <button
            className="flex items-center gap-2 rounded-full px-4 py-1.5 border border-white/25 bg-white/5 backdrop-blur-md text-white/90 text-sm tracking-wide hover:bg-white/10 transition-colors"
            aria-label="Cart"
          >
            <span>Cart</span>
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
