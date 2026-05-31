import { Link } from '@tanstack/react-router';
import { Phone, MapPin, Send, Camera } from 'lucide-react';
import { STORE_INFO } from '@nuraskin/shared-utils';
import { useCategories } from '@/hooks/useCategories';

export const Footer = () => {
  const { data } = useCategories();
  const categories = Array.isArray(data) ? data : ((data as any)?.data ?? []);

  return (
    <footer className="bg-white border-t border-stone-100 pt-14 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand + Nav Links */}
          <div>
            <Link
              to="/"
              className="block text-[15px] font-light tracking-[0.08em] text-[#4A1525] mb-6"
            >
              {STORE_INFO.NAME}
            </Link>
            <ul className="space-y-2.5 text-[13px] font-light text-stone-500">
              <li>
                <Link to="/about" className="hover:text-[#4A1525] transition-colors">
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#4A1525] transition-colors">
                  Aloqa
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[13px] font-light text-[#4A1525] tracking-wide mb-5">
              Teri parvarishi
            </h4>
            <ul className="space-y-2.5 text-[13px] font-light text-stone-500">
              {categories.slice(0, 5).map((cat: any) => (
                <li key={cat.id}>
                  <Link
                    to="/products"
                    search={{ category: cat.slug }}
                    className="text-sm text-stone-500 hover:text-[#4A1525] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/products" className="hover:text-[#4A1525] transition-colors">
                  Barchasini ko'rish
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-[13px] font-light text-[#4A1525] tracking-wide mb-5">
              Ijtimoiy tarmoqlar
            </h4>
            <ul className="space-y-2.5 text-[13px] font-light text-stone-500">
              <li>
                <div className="flex items-center gap-2 hover:text-[#4A1525] transition-colors">
                  <Camera size={14} strokeWidth={1.5} className="text-stone-400" />
                  <a
                    href={STORE_INFO.SOCIAL.INSTAGRAM.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stone-500 hover:text-[#4A1525] transition-colors"
                  >
                    {STORE_INFO.SOCIAL.INSTAGRAM.name}
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-2 hover:text-[#4A1525] transition-colors">
                  <Send size={14} strokeWidth={1.5} className="text-stone-400" />
                  <a
                    href={STORE_INFO.SOCIAL.TELEGRAM.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stone-500 hover:text-[#4A1525] transition-colors"
                  >
                    {STORE_INFO.SOCIAL.TELEGRAM.name}
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[13px] font-light text-[#4A1525] tracking-wide mb-5">Bog'lanish</h4>
            <ul className="space-y-3 mb-6">
              {STORE_INFO.PHONES.map(p => (
                <li
                  key={p.label}
                  className="flex items-start gap-2 text-[13px] font-light text-stone-500"
                >
                  <Phone
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-stone-400"
                    strokeWidth={1.5}
                  />
                  <a
                    href={p.href}
                    className="text-sm text-stone-500 hover:text-[#4A1525] transition-colors"
                  >
                    {p.label}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-2 text-[13px] font-light text-stone-500">
                <MapPin
                  className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-stone-400"
                  strokeWidth={1.5}
                />
                <span className="leading-tight text-sm text-stone-500">
                  {STORE_INFO.ADDRESS.KO}
                </span>
              </li>
            </ul>

            {/* Desktop Telegram Button */}
            <div className="hidden md:block">
              <a
                href={STORE_INFO.SOCIAL.TELEGRAM.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#4A1525] text-white py-2.5 px-4 rounded-full hover:bg-[#6B2540] transition-all duration-300 group"
              >
                <Send size={16} strokeWidth={2} />
                <span className="text-[12px] font-normal tracking-wide">
                  {STORE_INFO.SOCIAL.TELEGRAM.name} guruhiga qo'shiling
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Telegram CTA — Full width */}
      <div className="md:hidden px-6 mb-10">
        <a
          href={STORE_INFO.SOCIAL.TELEGRAM.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-[#4A1525] text-white py-4 px-8 rounded-full hover:bg-[#6B2540] transition-all duration-300 group"
        >
          <Send size={20} strokeWidth={2} />
          <span className="text-[14px] font-light tracking-wide">
            {STORE_INFO.SOCIAL.TELEGRAM.name} guruhiga qo'shiling
          </span>
        </a>
      </div>

      <div className="max-w-[1280px] mx-auto px-6">
        {/* Bottom */}
        <div className="pt-6 border-t border-stone-100 text-center">
          <p className="text-[11px] font-light text-stone-400">
            © {new Date().getFullYear()} {STORE_INFO.NAME}
          </p>
        </div>
      </div>
    </footer>
  );
};
