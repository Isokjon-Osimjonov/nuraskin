import { Link } from '@tanstack/react-router';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  // Hardcoded for now based on previous design, avoiding missing api dependencies
  const instagram = 'nuraskin';
  const telegram = 'nuraskin';
  const facebook = 'nuraskin';
  const phone = '+998 90 123 45 67';
  const email = 'info@nuraskin.uz';
  const address = 'Toshkent';

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
              NuraSkin
            </Link>
            <ul className="space-y-2.5 text-[13px] font-light text-stone-500">
              <li>
                <Link
                  to="/about"
                  className="hover:text-[#4A1525] transition-colors"
                >
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#4A1525] transition-colors"
                >
                  Aloqa
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-[#4A1525] transition-colors"
                >
                  Ko'p so'raladigan savollar
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
              <li>
                <span className="hover:text-[#4A1525] transition-colors cursor-pointer">
                  Serumlar
                </span>
              </li>
              <li>
                <span className="hover:text-[#4A1525] transition-colors cursor-pointer">
                  Kremlar
                </span>
              </li>
              <li>
                <span className="hover:text-[#4A1525] transition-colors cursor-pointer">
                  Tozalovchilar
                </span>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-[#4A1525] transition-colors"
                >
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
              {instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#4A1525] transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {telegram && (
                <li>
                  <a
                    href={`https://t.me/${telegram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#4A1525] transition-colors"
                  >
                    Telegram
                  </a>
                </li>
              )}
              {facebook && (
                <li>
                  <a
                    href={`https://facebook.com/${facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#4A1525] transition-colors"
                  >
                    Facebook
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[13px] font-light text-[#4A1525] tracking-wide mb-5">
              Bog'lanish
            </h4>
            <ul className="space-y-3 mb-6">
              {phone && (
                <li className="flex items-start gap-2 text-[13px] font-light text-stone-500">
                  <Phone
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-stone-400"
                    strokeWidth={1.5}
                  />
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="hover:text-[#4A1525] transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2 text-[13px] font-light text-stone-500">
                  <Mail
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-stone-400"
                    strokeWidth={1.5}
                  />
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-[#4A1525] transition-colors"
                  >
                    {email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2 text-[13px] font-light text-stone-500">
                  <MapPin
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-stone-400"
                    strokeWidth={1.5}
                  />
                  <span>{address}</span>
                </li>
              )}
            </ul>

            {/* Desktop Telegram Button */}
            {telegram && (
              <div className="hidden md:block">
                <a
                  href={`https://t.me/${telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#4A1525] text-white py-2.5 px-4 rounded-full hover:bg-[#6B2540] transition-all duration-300 group"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  <span className="text-[12px] font-normal tracking-wide">
                    Guruhga qo'shiling
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Telegram CTA — Full width */}
      {telegram && (
        <div className="md:hidden px-6 mb-10">
          <a
            href={`https://t.me/${telegram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-[#4A1525] text-white py-4 px-8 rounded-full hover:bg-[#6B2540] transition-all duration-300 group"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            <span className="text-[14px] font-light tracking-wide">
              Telegram guruhga qo'shiling
            </span>
          </a>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6">
        {/* Bottom */}
        <div className="pt-6 border-t border-stone-100 text-center">
          <p className="text-[11px] font-light text-stone-400">
            © {new Date().getFullYear()} NuraSkin
          </p>
        </div>
      </div>
    </footer>
  );
};
