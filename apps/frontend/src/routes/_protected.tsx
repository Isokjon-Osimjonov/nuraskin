import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAppStore } from '@/stores/app.store';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ location }) => {
    const token = useAppStore.getState().token;
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: () => <Outlet />,
});
