import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AppSidebar } from '../components/shared/ui/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import { GlobalSearch } from '../components/GlobalSearch';

const PAGE_TITLES: Record<string, { parent?: string; title: string }> = {
  '/': { title: 'Dashboard' },
  '/orders': { parent: 'Savdo', title: 'Buyurtmalar' },
  '/customers': { parent: 'Savdo', title: 'Mijozlar' },
  '/coupons': { parent: 'Savdo', title: 'Kuponlar' },
  '/products': { parent: 'Mahsulotlar', title: 'Mahsulotlar' },
  '/categories': { parent: 'Mahsulotlar', title: 'Kategoriyalar' },
  '/inventory': { parent: 'Mahsulotlar', title: 'Inventar' },
  '/sales': { parent: 'Moliya', title: 'Sotuvlar' },
  '/accounting': { parent: 'Moliya', title: 'Buxgalteriya' },
  '/telegram': { parent: 'Marketing', title: 'Telegram' },
  '/settings': { parent: 'Tizim', title: 'Sozlamalar' },
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (user?.mustChangePassword) {
      navigate({ to: '/change-password' });
    }
  }, [user, navigate]);

  useEffect(() => {
    api
      .get<any>('/auth/me')
      .then(res => {
        const { token, setAuth } = useAuthStore.getState();
        if (token && res.data) setAuth(token, res.data);
      })
      .catch(() => {});
  }, []);

  const basePath = '/' + location.pathname.split('/')[1];
  const effectivePath = location.pathname === '/' ? '/' : basePath;
  const pageInfo = PAGE_TITLES[effectivePath] ?? { title: 'Sahifa' };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {pageInfo.parent && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink className="text-muted-foreground text-sm">
                      {pageInfo.parent}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">{pageInfo.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <GlobalSearch />
        </header>
          <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
