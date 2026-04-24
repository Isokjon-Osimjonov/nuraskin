import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHero = pathname === '/';
  const isLogin = pathname === '/login';

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        {!isLogin && <Navbar variant={isHero ? 'dark' : 'light'} />}
        <main className="flex-grow">
          <Outlet />
        </main>
        {!isLogin && <Footer />}
      </div>
    </QueryClientProvider>
  );
}
