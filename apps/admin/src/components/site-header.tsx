import { Search } from 'lucide-react';
import { useLocation } from '@tanstack/react-router';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function SiteHeader() {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Boshqaruv paneli';
    if (path.startsWith('/products')) return 'Mahsulotlar';
    if (path.startsWith('/orders')) return 'Buyurtmalar';
    if (path.startsWith('/categories')) return 'Kategoriyalar';
    if (path.startsWith('/inventory')) return 'Ombor';
    if (path.startsWith('/customers')) return 'Mijozlar';
    if (path.startsWith('/coupons')) return 'Kuponlar';
    if (path.startsWith('/sales')) return 'Sotuvlar';
    if (path.startsWith('/accounting')) return 'Buxgalteriya';
    if (path.startsWith('/telegram')) return 'Telegram';
    if (path.startsWith('/settings')) return 'Sozlamalar';
    return 'NuraSkin Admin';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
        <h1 className="text-sm font-medium">{getTitle()}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <form className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Qidiruv..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      </div>
    </header>
  );
}
