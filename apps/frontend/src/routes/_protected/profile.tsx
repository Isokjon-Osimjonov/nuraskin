import { useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';
import {
  Mail, LogOut, ShoppingBag, Settings, ChevronRight,
  Ticket, MapPin, Bell,
} from 'lucide-react';

export const Route = createFileRoute('/_protected/profile')({
  component: Profile,
});

function Profile() {
  const { isAuthenticated, user, logout } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  const displayName = user.firstName || user.first_name || user.name || 'Foydalanuvchi';
  const displayEmail = user.email || (user.username ? `@${user.username}` : '');

  const menuItems = [
    { icon: ShoppingBag, label: 'Buyurtmalarim', desc: "Barcha buyurtmalarni ko'rish", href: '/orders' },
    { icon: Bell, label: "Kutish ro'yxati", desc: 'Omborda yo\'q mahsulotlar', href: '/waiting-list' },
    { icon: Ticket, label: 'Kuponlarim', desc: 'Chegirma kuponlari', href: '/coupons' },
    { icon: MapPin, label: 'Manzillarim', desc: 'Yetkazib berish manzillari', href: '/addresses' },
    { icon: Settings, label: 'Sozlamalar', desc: 'Hisob sozlamalari', href: '/settings' },
  ];

  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[640px] mx-auto">
        {/* Profile Header */}
        <div className="bg-[#f8f7f5] rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#4A1525] flex items-center justify-center shrink-0">
              <span className="text-white text-xl font-normal">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-normal text-[#4A1525]">{displayName}</h1>
              {displayEmail && (
                <p className="text-[13px] font-light text-stone-500 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {displayEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-[#f8f7f5] rounded-2xl overflow-hidden mb-6">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              to={item.href as "/orders" | "/waiting-list" | "/coupons" | "/addresses" | "/settings"}
              className={`flex items-center gap-4 px-8 py-5 hover:bg-stone-100 transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-stone-200' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-[#4A1525]" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-[14px] font-normal text-stone-800">{item.label}</p>
                <p className="text-[12px] font-light text-stone-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300" strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full h-12 bg-white border border-stone-200 text-stone-600 font-light text-[14px] tracking-wide rounded-full hover:bg-stone-50 hover:border-stone-300 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Chiqish
        </button>
      </div>
    </div>
  );
}