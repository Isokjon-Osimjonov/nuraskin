import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    // If user info in store has mustChangePassword, redirect immediately
    if (user?.mustChangePassword) {
        navigate({ to: '/change-password' });
    }
  }, [user, navigate]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className="bg-sidebar"
      defaultOpen={false}
    >
      <AppSidebar variant="floating" />
      <SidebarInset className="bg-background overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
